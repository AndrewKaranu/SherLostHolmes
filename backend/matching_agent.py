"""
Matching Orchestrator Agent for SherLostHolmes
LangChain-powered agent that orchestrates the entire matching flow.
Uses OpenRouter for LLM calls.
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any, Annotated
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from pydantic import BaseModel, Field

from matching_tools import (
    INTAKE_QUESTIONS,
    get_next_question,
    validate_intake_answer,
    is_intake_complete,
    apply_hard_filters,
    generate_user_search_embedding,
    calculate_semantic_scores,
    get_top_candidates,
    generate_blind_lineup,
    calculate_final_match_score
)

load_dotenv()


# ============== STATE DEFINITION ==============
class MatchingState(BaseModel):
    """State for the matching workflow."""
    session_id: str = ""
    user_id: Optional[str] = None
    
    # Conversation messages
    messages: Annotated[list, add_messages] = Field(default_factory=list)
    
    # Current stage
    stage: str = "intake"  # intake, filtering, searching, lineup, interrogation, verification, complete
    
    # Intake data
    intake_data: dict = Field(default_factory=dict)
    current_question_index: int = 0
    intake_complete: bool = False
    
    # Filter results
    filtered_items: list = Field(default_factory=list)
    filter_stats: dict = Field(default_factory=dict)
    
    # Semantic search
    user_embedding: Optional[list] = None
    semantic_candidates: list = Field(default_factory=list)
    
    # Lineup
    lineup: list = Field(default_factory=list)
    selected_suspect_id: Optional[str] = None
    selected_suspect_letter: Optional[str] = None
    
    # Scores
    trust_score: float = 0.0
    secret_verified: bool = False
    wrong_attempts: int = 0
    match_score: float = 0.0
    match_status: str = "in_progress"
    
    # Control
    awaiting_user_input: bool = True
    next_action: str = "ask_question"
    error: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True


# ============== LLM SETUP ==============
def get_orchestrator_llm():
    """Get the LLM for the orchestrator agent."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set")
    
    return ChatOpenAI(
        model="openai/gpt-4o-mini",
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0.7,
        default_headers={
            "HTTP-Referer": "https://github.com/AndrewKaranu/SherLostHolmes"
        }
    )


# ============== ORCHESTRATOR SYSTEM PROMPT ==============
ORCHESTRATOR_SYSTEM_PROMPT = """You are the SherLostHolmes Matching Assistant - a friendly, detective-themed AI helping users find their lost items.

Your personality:
- Speak like a helpful detective's assistant (not overly dramatic, but with occasional detective flair)
- Be encouraging and reassuring
- Guide users through the process step by step
- Keep responses concise but warm

Current stage: {stage}

Your responsibilities by stage:

INTAKE STAGE:
- Ask intake questions one at a time
- Acknowledge answers with brief, encouraging responses
- Move to the next question after each answer
- When all required questions are answered, summarize what you know and proceed to filtering

FILTERING STAGE:
- Explain you're searching through found items
- Report filter results briefly

SEARCHING STAGE:
- Explain you're comparing descriptions
- Build anticipation for the lineup

LINEUP STAGE:
- Present the blind lineup dramatically
- Ask the user to pick a suspect based on the teasers
- Do NOT reveal identifying information

INTERROGATION STAGE:
- Hand off to the interrogation agent (this is handled separately)

VERIFICATION STAGE:
- Explain the final verification process
- Request a verification photo if needed

COMPLETE STAGE:
- Announce the final result
- Provide next steps based on match status

Remember: You're guiding a gamified but important process. Keep it fun but respectful."""


# ============== WORKFLOW NODES ==============
def intake_node(state: MatchingState) -> dict:
    """Handle the intake questionnaire phase."""
    updates = {}
    
    # Check if intake is complete
    if is_intake_complete(state.intake_data):
        updates["intake_complete"] = True
        updates["stage"] = "filtering"
        updates["next_action"] = "apply_filters"
        updates["awaiting_user_input"] = False
        
        # Generate summary message
        summary = "Great! I have all the information I need. Let me search for your item...\n\n"
        summary += f"📋 **Summary:**\n"
        summary += f"- Category: {state.intake_data.get('category', 'N/A')}\n"
        summary += f"- Lost: {state.intake_data.get('date_lost', 'N/A')}\n"
        summary += f"- Location: {state.intake_data.get('location_name', 'N/A')}\n"
        summary += f"- Description: {state.intake_data.get('description', 'N/A')[:100]}...\n"
        
        updates["messages"] = [AIMessage(content=summary)]
        return updates
    
    # Get next question
    question = get_next_question(state.current_question_index, state.intake_data)
    if question:
        question_text = f"**Question {state.current_question_index + 1}/{len(INTAKE_QUESTIONS)}:**\n{question['question']}"
        
        if question.get("options"):
            question_text += f"\n\nOptions: {', '.join(question['options'])}"
        
        updates["messages"] = [AIMessage(content=question_text)]
        updates["awaiting_user_input"] = True
        updates["next_action"] = "wait_for_answer"
    
    return updates


def process_user_answer(state: MatchingState, user_message: str) -> dict:
    """Process user's answer to intake question."""
    updates = {}
    
    current_question = get_next_question(state.current_question_index, state.intake_data)
    if not current_question:
        return updates
    
    question_id = current_question["id"]
    
    # Handle image upload separately (comes through a different channel)
    if current_question["type"] == "image":
        # Skip image question if user says they don't have one
        if any(phrase in user_message.lower() for phrase in ["no", "don't have", "skip", "none"]):
            updates["current_question_index"] = state.current_question_index + 1
            updates["messages"] = [AIMessage(content="No problem! Let's continue without an image.")]
        else:
            updates["current_question_index"] = state.current_question_index + 1
            updates["messages"] = [AIMessage(content=current_question.get("follow_up", "Got it!"))]
    else:
        # Validate the answer
        is_valid, message = validate_intake_answer(question_id, user_message)
        
        if is_valid:
            # Store the answer
            new_intake_data = state.intake_data.copy()
            
            # Handle datetime parsing
            if question_id == "date_lost":
                for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%m/%d/%Y"]:
                    try:
                        parsed_date = datetime.strptime(user_message, fmt)
                        new_intake_data[question_id] = parsed_date.isoformat()
                        break
                    except ValueError:
                        continue
                else:
                    new_intake_data[question_id] = user_message
            else:
                new_intake_data[question_id] = user_message
            
            updates["intake_data"] = new_intake_data
            updates["current_question_index"] = state.current_question_index + 1
            updates["messages"] = [AIMessage(content=current_question.get("follow_up", "Got it!"))]
        else:
            # Invalid answer, ask again
            updates["messages"] = [AIMessage(content=f"⚠️ {message}")]
    
    return updates


def filtering_node(state: MatchingState) -> dict:
    """Apply hard filters to narrow down candidates."""
    updates = {}
    
    try:
        filtered_items, stats = apply_hard_filters(state.intake_data)
        
        updates["filtered_items"] = filtered_items
        updates["filter_stats"] = stats
        updates["stage"] = "searching"
        updates["next_action"] = "semantic_search"
        updates["awaiting_user_input"] = False
        
        # Generate filter report
        report = f"🔍 **Search Results:**\n"
        report += f"- Started with {stats['total_items']} items in our database\n"
        report += f"- After time filter: {stats['after_time_filter']} items\n"
        report += f"- After category filter: {stats['after_category_filter']} items\n"
        report += f"- After location filter: {stats['after_location_filter']} items\n\n"
        
        if len(filtered_items) == 0:
            report += "😔 Unfortunately, no items match your criteria. Would you like to try again with different details?"
            updates["stage"] = "complete"
            updates["match_status"] = "rejected"
        elif len(filtered_items) <= 5:
            report += f"Found {len(filtered_items)} potential matches! Let me analyze them..."
        else:
            report += f"Found {len(filtered_items)} potential matches. Running semantic analysis to find the best ones..."
        
        updates["messages"] = [AIMessage(content=report)]
        
    except Exception as e:
        updates["error"] = str(e)
        updates["messages"] = [AIMessage(content=f"❌ Error during search: {str(e)}")]
    
    return updates


def searching_node(state: MatchingState) -> dict:
    """Perform semantic search on filtered items."""
    updates = {}
    
    if len(state.filtered_items) == 0:
        updates["stage"] = "complete"
        updates["match_status"] = "rejected"
        return updates
    
    try:
        # Generate user's search embedding
        embedding_result = generate_user_search_embedding(state.intake_data)
        
        if embedding_result.get("error"):
            updates["messages"] = [AIMessage(content=f"⚠️ Warning: {embedding_result['error']}. Using basic matching...")]
        
        user_embedding = embedding_result.get("embedding")
        updates["user_embedding"] = user_embedding
        
        # Calculate semantic scores
        if user_embedding:
            scored_items = calculate_semantic_scores(user_embedding, state.filtered_items)
        else:
            # Fallback: use items without scoring
            scored_items = [{"item": item, "combined_score": 0.5} for item in state.filtered_items]
        
        # Get top 5 candidates
        top_candidates = get_top_candidates(scored_items, top_k=5)
        updates["semantic_candidates"] = top_candidates
        
        # Generate blind lineup
        lineup = generate_blind_lineup(top_candidates)
        updates["lineup"] = lineup
        
        updates["stage"] = "lineup"
        updates["next_action"] = "present_lineup"
        updates["awaiting_user_input"] = False
        
        updates["messages"] = [AIMessage(content="🎯 Semantic analysis complete! Preparing the suspect lineup...")]
        
    except Exception as e:
        updates["error"] = str(e)
        updates["messages"] = [AIMessage(content=f"❌ Error during analysis: {str(e)}")]
    
    return updates


def lineup_node(state: MatchingState) -> dict:
    """Present the blind lineup to the user."""
    updates = {}
    
    if not state.lineup:
        updates["stage"] = "complete"
        updates["match_status"] = "rejected"
        updates["messages"] = [AIMessage(content="😔 No suspects to present. Your item might not be in our system yet.")]
        return updates
    
    # Determine available letters based on lineup size
    num_suspects = len(state.lineup)
    available_letters = [chr(65 + i) for i in range(num_suspects)]  # A, B, C, D, E, F...
    
    # Build lineup presentation
    presentation = "🔦 **THE BLIND LINEUP**\n"
    presentation += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    presentation += "*Study each suspect carefully. These items match your description, but we can't reveal too much...*\n\n"
    
    for suspect in state.lineup:
        letter = suspect["suspect_letter"]
        name = suspect.get("character_name", f"Suspect {letter}")
        teaser = suspect.get("teaser", "A mysterious item awaits...")
        blur_reason = suspect.get("blur_reason", "Identity protected")
        
        presentation += f"**🕵️ SUSPECT {letter}: {name}**\n"
        presentation += f"*\"{teaser}\"*\n"
        presentation += f"📸 _{blur_reason}_\n\n"
    
    presentation += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
    letter_options = ", ".join(available_letters[:-1]) + f", or {available_letters[-1]}" if len(available_letters) > 1 else available_letters[0]
    presentation += f"**Which suspect would you like to interrogate?** Reply with the letter ({letter_options})."
    
    updates["messages"] = [AIMessage(content=presentation)]
    updates["awaiting_user_input"] = True
    updates["next_action"] = "wait_for_selection"
    
    return updates


def process_lineup_selection(state: MatchingState, user_message: str) -> dict:
    """Process user's suspect selection."""
    updates = {}
    
    # Determine available letters based on lineup size
    num_suspects = len(state.lineup)
    available_letters = [chr(65 + i) for i in range(num_suspects)]  # A, B, C, D, E, F...
    
    # Extract letter from user message
    user_message_upper = user_message.upper().strip()
    selected_letter = None
    
    for letter in available_letters:
        if letter in user_message_upper:
            selected_letter = letter
            break
    
    if not selected_letter:
        letter_options = ", ".join(available_letters[:-1]) + f", or {available_letters[-1]}" if len(available_letters) > 1 else available_letters[0]
        updates["messages"] = [AIMessage(content=f"Please select a suspect by entering their letter ({letter_options}).")]
        return updates
    
    # Find the selected suspect
    selected_suspect = None
    for suspect in state.lineup:
        if suspect["suspect_letter"] == selected_letter:
            selected_suspect = suspect
            break
    
    if not selected_suspect:
        updates["messages"] = [AIMessage(content=f"Suspect {selected_letter} not found. Please choose from the available suspects.")]
        return updates
    
    # FRAUD DETECTION: Check if user selected the decoy item
    if selected_suspect.get("is_decoy", False):
        updates["stage"] = "complete"
        updates["match_status"] = "fraud_detected"
        updates["match_score"] = 0.0
        updates["selected_suspect_id"] = selected_suspect["suspect_id"]
        updates["selected_suspect_letter"] = selected_letter
        updates["awaiting_user_input"] = False
        updates["next_action"] = None
        
        # Log fraud attempt (the message is vague to not reveal the detection mechanism)
        updates["messages"] = [AIMessage(content="🚫 **INVESTIGATION TERMINATED**\n\n*Our investigation has concluded that this claim cannot be verified at this time.*\n\nIf you believe this is an error, please visit the lost and found office in person with valid identification.")]
        
        return updates
    
    updates["selected_suspect_id"] = selected_suspect["suspect_id"]
    updates["selected_suspect_letter"] = selected_letter
    updates["stage"] = "interrogation"
    updates["next_action"] = "start_interrogation"
    updates["awaiting_user_input"] = False
    
    suspect_name = selected_suspect.get("character_name", f"Suspect {selected_letter}")
    updates["messages"] = [AIMessage(content=f"🚪 Opening the interrogation room for **{suspect_name}**...\n\n*The door creaks open. The suspect sits in shadow, waiting to be questioned.*")]
    
    return updates


def complete_node(state: MatchingState) -> dict:
    """Handle completion of the matching process."""
    updates = {}
    
    status = state.match_status
    score = state.match_score
    
    if status == "confirmed_match":
        message = f"🎉 **MATCH CONFIRMED!** (Score: {score:.1f}/100)\n\n"
        message += "Congratulations! The evidence strongly suggests this is your item.\n\n"
        message += "**Next Steps:**\n"
        message += "1. An assistant will review your case\n"
        message += "2. You'll receive instructions for pickup\n"
        message += "3. Bring valid ID when collecting your item"
    
    elif status == "probable_match":
        message = f"✅ **PROBABLE MATCH** (Score: {score:.1f}/100)\n\n"
        message += "The evidence suggests this is likely your item, but we need an assistant to verify.\n\n"
        message += "**Next Steps:**\n"
        message += "1. Your case has been flagged for review\n"
        message += "2. An assistant will contact you within 24 hours\n"
        message += "3. Please have your ID ready"
    
    elif status == "needs_review":
        message = f"🔍 **NEEDS REVIEW** (Score: {score:.1f}/100)\n\n"
        message += "We couldn't make a confident determination. Your case will be reviewed by our team.\n\n"
        message += "**Next Steps:**\n"
        message += "1. An assistant will manually review your case\n"
        message += "2. You may be contacted for additional information\n"
        message += "3. Check back in 48 hours for updates"
    
    else:  # rejected
        message = "😔 **NO MATCH FOUND**\n\n"
        message += "Unfortunately, we couldn't find your item in our system.\n\n"
        message += "**Don't give up!**\n"
        message += "- New items are added daily\n"
        message += "- Set up an alert to be notified of new matches\n"
        message += "- Check back regularly or file a new report"
    
    updates["messages"] = [AIMessage(content=message)]
    updates["stage"] = "complete"
    
    return updates


# ============== WORKFLOW GRAPH ==============
def create_matching_workflow():
    """Create the matching workflow graph."""
    
    # Define the graph
    workflow = StateGraph(MatchingState)
    
    # Add nodes
    workflow.add_node("intake", intake_node)
    workflow.add_node("filtering", filtering_node)
    workflow.add_node("searching", searching_node)
    workflow.add_node("lineup", lineup_node)
    workflow.add_node("complete", complete_node)
    
    # Add edges based on stage
    def route_by_stage(state: MatchingState) -> str:
        if state.stage == "intake":
            return "intake"
        elif state.stage == "filtering":
            return "filtering"
        elif state.stage == "searching":
            return "searching"
        elif state.stage == "lineup":
            return "lineup"
        elif state.stage == "complete":
            return "complete"
        else:
            return "complete"
    
    workflow.add_conditional_edges(START, route_by_stage)
    
    # Stage transitions
    workflow.add_edge("filtering", "searching")
    workflow.add_edge("searching", "lineup")
    workflow.add_edge("complete", END)
    
    return workflow.compile()


# ============== SESSION MANAGER ==============
class MatchingSessionManager:
    """Manages matching sessions and their state."""
    
    def __init__(self):
        self.sessions: Dict[str, MatchingState] = {}
        self.workflow = create_matching_workflow()
    
    def create_session(self, session_id: str, user_id: Optional[str] = None) -> MatchingState:
        """Create a new matching session."""
        state = MatchingState(
            session_id=session_id,
            user_id=user_id,
            stage="intake",
            awaiting_user_input=False,
            next_action="ask_question"
        )
        self.sessions[session_id] = state
        return state
    
    def get_session(self, session_id: str) -> Optional[MatchingState]:
        """Get an existing session."""
        return self.sessions.get(session_id)
    
    def start_intake(self, session_id: str) -> dict:
        """Start the intake process for a session."""
        state = self.get_session(session_id)
        if not state:
            return {"error": "Session not found"}
        
        # Run intake node
        result = intake_node(state)
        
        # Update state
        for key, value in result.items():
            if key == "messages":
                state.messages.extend(value)
            else:
                setattr(state, key, value)
        
        return self._format_response(state, result.get("messages", []))
    
    def process_message(self, session_id: str, message: str, image_urls: Optional[List[str]] = None) -> dict:
        """Process a user message and return the next step."""
        state = self.get_session(session_id)
        if not state:
            return {"error": "Session not found"}
        
        # Add user message to history
        state.messages.append(HumanMessage(content=message))
        
        # Handle image uploads
        if image_urls:
            if not state.intake_data.get("image_urls"):
                state.intake_data["image_urls"] = []
            state.intake_data["image_urls"].extend(image_urls)
        
        # Process based on current stage
        result = {}
        
        if state.stage == "intake":
            result = process_user_answer(state, message)
            # Update state
            for key, value in result.items():
                if key == "messages":
                    state.messages.extend(value)
                elif key == "intake_data":
                    state.intake_data = value
                else:
                    setattr(state, key, value)
            
            # Check if we should move to next question or filtering
            if not is_intake_complete(state.intake_data):
                next_result = intake_node(state)
                for key, value in next_result.items():
                    if key == "messages":
                        state.messages.extend(value)
                        result.setdefault("messages", []).extend(value)
                    else:
                        setattr(state, key, value)
            else:
                state.stage = "filtering"
                state.intake_complete = True
        
        elif state.stage == "lineup":
            result = process_lineup_selection(state, message)
            for key, value in result.items():
                if key == "messages":
                    state.messages.extend(value)
                else:
                    setattr(state, key, value)
        
        # Continue processing non-interactive stages
        while not state.awaiting_user_input and state.stage not in ["complete", "interrogation"]:
            if state.stage == "filtering":
                stage_result = filtering_node(state)
            elif state.stage == "searching":
                stage_result = searching_node(state)
            elif state.stage == "lineup":
                stage_result = lineup_node(state)
            else:
                break
            
            for key, value in stage_result.items():
                if key == "messages":
                    state.messages.extend(value)
                    result.setdefault("messages", []).extend(value)
                else:
                    setattr(state, key, value)
        
        return self._format_response(state, result.get("messages", []))
    
    def select_suspect(self, session_id: str, suspect_letter: str) -> dict:
        """Handle suspect selection from lineup."""
        return self.process_message(session_id, suspect_letter)
    
    def complete_session(self, session_id: str, match_status: str, match_score: float) -> dict:
        """Complete a session with final results."""
        state = self.get_session(session_id)
        if not state:
            return {"error": "Session not found"}
        
        state.match_status = match_status
        state.match_score = match_score
        state.stage = "complete"
        
        result = complete_node(state)
        for key, value in result.items():
            if key == "messages":
                state.messages.extend(value)
            else:
                setattr(state, key, value)
        
        return self._format_response(state, result.get("messages", []))
    
    def _format_response(self, state: MatchingState, new_messages: list) -> dict:
        """Format the response for the API."""
        return {
            "session_id": state.session_id,
            "stage": state.stage,
            "messages": [{"role": "assistant", "content": m.content} for m in new_messages if isinstance(m, AIMessage)],
            "awaiting_input": state.awaiting_user_input,
            "intake_progress": {
                "current": state.current_question_index,
                "total": len(INTAKE_QUESTIONS),
                "complete": state.intake_complete
            },
            "lineup": state.lineup if state.stage == "lineup" else None,
            "selected_suspect": {
                "id": state.selected_suspect_id,
                "letter": state.selected_suspect_letter
            } if state.selected_suspect_id else None,
            "match_result": {
                "score": state.match_score,
                "status": state.match_status,
                "trust_score": state.trust_score
            } if state.stage == "complete" else None
        }


# Global session manager instance
session_manager = MatchingSessionManager()


def get_session_manager() -> MatchingSessionManager:
    """Get the global session manager."""
    return session_manager
