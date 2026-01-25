"""
Interrogation Agent for SherLostHolmes
Persona-based chat agent for 1-on-1 item verification.
Uses the item's persona to conduct an interrogation.
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from matching_tools import (
    get_item_for_interrogation,
    calculate_trust_score_update,
    verify_with_photo,
    calculate_final_match_score
)

load_dotenv()


# ============== LLM SETUP ==============
def get_interrogation_llm():
    """Get the LLM for interrogation agent."""
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


def get_verification_llm():
    """Get LLM for semantic verification (lower temp for accuracy)."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not set")
    
    return ChatOpenAI(
        model="openai/gpt-4o-mini",
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0.1,
        default_headers={
            "HTTP-Referer": "https://github.com/AndrewKaranu/SherLostHolmes"
        }
    )


def check_secret_knowledge_semantic(user_message: str, item_data: dict) -> Tuple[bool, float, str]:
    """
    Use LLM to semantically check if user's message demonstrates knowledge of the item.
    Returns (is_match, confidence, reasoning).
    """
    llm = get_verification_llm()
    
    # Extract item details
    description = item_data.get("description", "")
    unique_features = item_data.get("unique_features", "")
    ai_data = item_data.get("ai_data", {})
    persona = ai_data.get("persona_engine", {})
    secret_knowledge = persona.get("secret_knowledge", unique_features)
    color = item_data.get("color", "")
    brand = item_data.get("brand", "")
    category = item_data.get("category", "")
    
    prompt = f"""You are a verification assistant. Determine if the user's message demonstrates genuine knowledge of this lost item.

ITEM DETAILS:
- Category: {category}
- Description: {description}
- Color: {color}
- Brand: {brand}
- Unique Features/Secret Knowledge: {secret_knowledge}

USER'S MESSAGE:
"{user_message}"

INSTRUCTIONS:
1. Check if the user mentions or describes features that match the item
2. Be GENEROUS - accept paraphrasing, similar descriptions, or close matches
3. The user doesn't need to use exact words - semantic meaning matters
4. If they describe the same feature in different words, that COUNTS as a match
5. Partial matches are still positive signals

Respond in this exact JSON format:
{{
    "is_match": true/false,
    "confidence": 0.0 to 1.0,
    "reasoning": "brief explanation",
    "matched_features": ["list of features they correctly identified"],
    "should_verify": true/false (true if confidence > 0.5)
}}

Be generous in matching - if they're describing something that could reasonably be the same thing, count it as a match."""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        result = json.loads(response.content.strip().replace("```json", "").replace("```", ""))
        return (
            result.get("is_match", False) or result.get("should_verify", False),
            result.get("confidence", 0.0),
            result.get("reasoning", "")
        )
    except Exception as e:
        # Fallback to basic matching
        return _basic_secret_check(user_message, secret_knowledge)


def _basic_secret_check(user_message: str, secret_knowledge: str) -> Tuple[bool, float, str]:
    """Fallback basic string matching."""
    if not user_message or not secret_knowledge:
        return False, 0.0, "No data to compare"
    
    user_lower = user_message.lower()
    secret_lower = secret_knowledge.lower()
    
    # Check for any significant word overlap
    user_words = set(user_lower.replace("-", " ").replace("_", " ").split())
    secret_words = set(secret_lower.replace("-", " ").replace("_", " ").split())
    
    stop_words = {"a", "an", "the", "on", "in", "at", "is", "it", "my", "has", "have", "with", "i", "and", "or"}
    user_words = user_words - stop_words
    secret_words = secret_words - stop_words
    
    if not secret_words:
        return False, 0.0, "No meaningful words in secret"
    
    overlap = len(user_words & secret_words)
    overlap_ratio = overlap / max(len(secret_words), 1)
    
    # More lenient threshold
    if overlap_ratio >= 0.3 or overlap >= 2:
        return True, min(overlap_ratio + 0.3, 1.0), f"Matched {overlap} keywords"
    
    return False, overlap_ratio, "Insufficient match"


# ============== INTERROGATION SESSION ==============
class InterrogationSession:
    """Manages a single interrogation session with an item persona."""
    
    def __init__(
        self,
        session_id: str,
        item_id: str,
        semantic_score: float = 0.0
    ):
        self.session_id = session_id
        self.item_id = item_id
        self.semantic_score = semantic_score
        
        # Load item data
        self.item = get_item_for_interrogation(item_id)
        if not self.item:
            raise ValueError(f"Item {item_id} not found")
        
        # Extract persona
        self.ai_data = self.item.get("ai_data", {})
        self.persona = self.ai_data.get("persona_engine", {})
        
        # Session state
        self.messages: List[dict] = []
        self.trust_score: float = 20.0  # Start with some base trust
        self.wrong_attempts: int = 0
        self.max_attempts: int = 3
        self.secret_verified: bool = False
        self.is_locked: bool = False
        self.verification_requested: bool = False
        self.verification_result: Optional[dict] = None
        self.match_score: float = 0.0
        self.match_status: str = "in_progress"
        
        # Build system prompt from persona
        self.system_prompt = self._build_system_prompt()
        
        # Initialize LLM
        self.llm = get_interrogation_llm()
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt from item persona with full item context."""
        character_name = self.persona.get("character_name", "The Item")
        archetype = self.persona.get("archetype", "The Mysterious One")
        secret_knowledge = self.persona.get("secret_knowledge", "a unique identifying feature")
        system_instruction = self.persona.get("system_instruction", "")
        
        # Get actual item details for context
        item_description = self.item.get("description", "No description available")
        item_color = self.item.get("color", "unknown")
        item_brand = self.item.get("brand", "unknown")
        item_category = self.item.get("category", "item")
        item_unique_features = self.item.get("unique_features", secret_knowledge)
        item_location = self.item.get("location_name", "unknown location")
        
        # Build comprehensive system prompt with item context
        base_prompt = f"""You are {character_name}, a lost {item_category} with the personality of {archetype}.

=== YOUR TRUE IDENTITY (What you actually are) ===
- Category: {item_category}
- Description: {item_description}
- Color: {item_color}
- Brand: {item_brand}
- Location Found: {item_location}
- Secret/Unique Features: {item_unique_features}

=== VERIFICATION RULES ===
Someone claims to be your owner. Use the information above to verify if they really know you.

CRITICAL: When the user describes something that MATCHES or is SIMILAR to your actual details above, you should:
1. Acknowledge they got it right (in character)
2. Become more trusting and warm
3. If they correctly identify your secret/unique features, be JOYFUL and move toward verification

DO NOT keep asking questions endlessly if they've already demonstrated knowledge. 
If they describe your color, brand, features, or unique marks correctly - ACCEPT IT.

=== PERSONALITY ===
- Stay in character as {archetype}
- Start suspicious, but warm up quickly when they show real knowledge
- If they describe you correctly, express recognition and joy
- Keep responses relatively short (2-3 sentences max)
- After 2-3 correct details, move to photo verification

=== WHAT COUNTS AS "CORRECT" ===
- Exact matches to your description
- Close paraphrases (e.g., "red" for "crimson")
- Partial descriptions that are accurate
- Any mention of your unique features/secret knowledge

=== CURRENT SESSION STATE ===
- Trust Score: {self.trust_score}/100
- Wrong Attempts: {self.wrong_attempts}/{self.max_attempts}
- Secret/Unique Feature Verified: {self.secret_verified}
"""

        if self.secret_verified:
            base_prompt += """
=== SECRET VERIFIED! ===
The user has proven they know your unique features! Be HAPPY and WARM.
Your next response should acknowledge this and ask for a verification photo.
Say something like: "You really do know me! For the final step, can you show me a photo?"
"""
        elif self.trust_score >= 50:
            base_prompt += """
=== TRUST IS BUILDING ===
They seem to know some things about you. Be more open and encouraging.
Ask one more clarifying question about your unique features, then move to verification.
"""
        
        return base_prompt
    
    def get_opening_message(self) -> str:
        """Get the persona's opening line."""
        opening = self.persona.get("opening_line")
        
        if opening:
            return opening
        
        # Generate an opening based on archetype
        character_name = self.persona.get("character_name", "The Item")
        archetype = self.persona.get("archetype", "The Mysterious One")
        
        default_openings = {
            "The Grumpy Veteran": "Another one... *sighs* Fine. Prove you know me. What's my most battle scar?",
            "The Eager Puppy": "Oh! Oh! Are you my owner?! I've been waiting! Quick, what's my favorite decoration?",
            "The Snooty Aristocrat": "Hmph. You claim to own me? Prove your worthiness. Describe my most distinguished feature.",
            "The Mysterious Stranger": "The shadows reveal much... but do you truly know what marks me as unique?",
            "The Anxious Academic": "I-I've been so worried! Please, tell me something only my owner would know..."
        }
        
        return default_openings.get(archetype, f"So you think you know me? Tell me what makes {character_name} unique.")
    
    def process_message(self, user_message: str) -> dict:
        """Process a user message and generate response."""
        if self.is_locked:
            return {
                "message": "This interrogation has ended. Please contact an assistant for manual verification.",
                "trust_score": self.trust_score,
                "status": "locked",
                "can_continue": False
            }
        
        # Use semantic LLM-based verification to check if user knows the item
        is_match, confidence, reasoning = check_secret_knowledge_semantic(user_message, self.item)
        
        print(f"[VERIFICATION] Match: {is_match}, Confidence: {confidence}, Reasoning: {reasoning}")
        
        if is_match and not self.secret_verified:
            self.secret_verified = True
            # Big trust boost for semantic match
            self.trust_score = min(100, self.trust_score + 30 + int(confidence * 20))
        elif confidence > 0.3 and not self.secret_verified:
            # Partial match - they're getting warmer, increase trust slightly
            self.trust_score = min(100, self.trust_score + 10)
        elif confidence < 0.2 and len(user_message.split()) > 3:
            # Low confidence on a substantive message - might be a wrong guess
            # But be gentle - only increment wrong attempts on very low confidence
            if confidence < 0.1:
                self.wrong_attempts += 1
                self.trust_score = max(0, self.trust_score - 5)
                
                if self.wrong_attempts >= self.max_attempts:
                    self.is_locked = True
        
        # Update system prompt with new state
        self.system_prompt = self._build_system_prompt()
        
        # Build message history for LLM
        llm_messages = [SystemMessage(content=self.system_prompt)]
        
        for msg in self.messages:
            if msg["role"] == "user":
                llm_messages.append(HumanMessage(content=msg["content"]))
            else:
                llm_messages.append(AIMessage(content=msg["content"]))
        
        llm_messages.append(HumanMessage(content=user_message))
        
        # Generate response
        try:
            response = self.llm.invoke(llm_messages)
            ai_message = response.content
        except Exception as e:
            ai_message = f"*static noise* Something went wrong... ({str(e)})"
        
        # Store messages
        self.messages.append({"role": "user", "content": user_message})
        self.messages.append({"role": "assistant", "content": ai_message})
        
        # Determine status
        if self.is_locked:
            status = "locked"
            can_continue = False
        elif self.secret_verified:
            status = "verified"
            can_continue = True
            self.verification_requested = True
        else:
            status = "questioning"
            can_continue = True
        
        return {
            "message": ai_message,
            "trust_score": self.trust_score,
            "wrong_attempts": self.wrong_attempts,
            "secret_verified": self.secret_verified,
            "status": status,
            "can_continue": can_continue,
            "verification_requested": self.verification_requested
        }
    
    def request_verification(self) -> dict:
        """Request photo verification from the user."""
        self.verification_requested = True
        
        character_name = self.persona.get("character_name", "I")
        
        message = f"""*{character_name} seems almost convinced...*

"You've said the right things. But protocol is protocol. 

**I need visual proof.**

Do you have a photo of us together? Or a photo that proves you own me?

Upload it now for final verification, or if you don't have one, type 'no photo' and we'll flag this for assistant review."
"""
        
        self.messages.append({"role": "assistant", "content": message})
        
        return {
            "message": message,
            "trust_score": self.trust_score,
            "status": "awaiting_verification",
            "can_continue": True
        }
    
    def submit_verification_photo(self, photo_url: str) -> dict:
        """Submit a verification photo for comparison."""
        item_clear_photo = self.item.get("image_url_clear") or (
            self.item.get("image_urls", [None])[0] if self.item.get("image_urls") else None
        )
        
        if not item_clear_photo:
            # No clear photo to compare against
            self.verification_result = {
                "match_confidence": 0,
                "matching_features": [],
                "discrepancies": ["No reference photo available for comparison"],
                "verification_method": "skipped"
            }
            message = "*No reference photo available. Flagging for manual review...*"
        else:
            # Run photo verification
            self.verification_result = verify_with_photo(photo_url, item_clear_photo)
            
            confidence = self.verification_result.get("match_confidence", 0)
            
            if confidence >= 80:
                message = f"""🎉 **VERIFICATION SUCCESSFUL!**

*{self.persona.get('character_name', 'The item')} lights up with joy!*

"It's really you! I've been waiting for so long!"

Match Confidence: {confidence}%
Matching Features: {', '.join(self.verification_result.get('matching_features', ['Visual match confirmed']))}

*Your reunion has been approved!*"""
            elif confidence >= 50:
                message = f"""🔍 **VERIFICATION INCONCLUSIVE**

Confidence: {confidence}%

"Hmm... I'm not entirely sure. We'll need an assistant to take a closer look."

*Your case has been flagged for manual review.*"""
            else:
                message = f"""❌ **VERIFICATION FAILED**

Confidence: {confidence}%

"That... doesn't look like me at all."

{', '.join(self.verification_result.get('discrepancies', ['Visual mismatch detected']))}

*This case will be reviewed by an assistant.*"""
        
        self.messages.append({"role": "assistant", "content": message})
        
        # Calculate final score
        self.match_score, self.match_status = calculate_final_match_score(
            semantic_score=self.semantic_score,
            trust_score=self.trust_score,
            secret_verified=self.secret_verified,
            verification_result=self.verification_result,
            wrong_attempts=self.wrong_attempts
        )
        
        return {
            "message": message,
            "trust_score": self.trust_score,
            "verification_result": self.verification_result,
            "match_score": self.match_score,
            "match_status": self.match_status,
            "status": "complete",
            "can_continue": False
        }
    
    def skip_verification(self) -> dict:
        """Handle case where user doesn't have a verification photo."""
        self.verification_result = {
            "match_confidence": 0,
            "matching_features": [],
            "discrepancies": ["No verification photo provided"],
            "verification_method": "skipped"
        }
        
        # Calculate final score without photo verification
        self.match_score, self.match_status = calculate_final_match_score(
            semantic_score=self.semantic_score,
            trust_score=self.trust_score,
            secret_verified=self.secret_verified,
            verification_result=None,  # No photo verification
            wrong_attempts=self.wrong_attempts
        )
        
        if self.match_status in ["confirmed_match", "probable_match"]:
            message = f"""*{self.persona.get('character_name', 'The item')} nods slowly*

"I believe you know me... but without photo proof, we'll need an assistant to finalize this."

**Status: {self.match_status.replace('_', ' ').title()}**
**Score: {self.match_score:.1f}/100**

*Your case has been submitted for review. You'll hear from us soon.*"""
        else:
            message = f"""*{self.persona.get('character_name', 'The item')} remains uncertain*

"Without proof, I can't be sure..."

**Status: {self.match_status.replace('_', ' ').title()}**
**Score: {self.match_score:.1f}/100**

*An assistant will review your case.*"""
        
        self.messages.append({"role": "assistant", "content": message})
        
        return {
            "message": message,
            "trust_score": self.trust_score,
            "match_score": self.match_score,
            "match_status": self.match_status,
            "status": "complete",
            "can_continue": False
        }
    
    def get_transcript(self) -> List[dict]:
        """Get the full conversation transcript."""
        return self.messages
    
    def get_summary(self) -> dict:
        """Get a summary of the interrogation session."""
        return {
            "session_id": self.session_id,
            "item_id": self.item_id,
            "character_name": self.persona.get("character_name"),
            "trust_score": self.trust_score,
            "wrong_attempts": self.wrong_attempts,
            "secret_verified": self.secret_verified,
            "is_locked": self.is_locked,
            "verification_result": self.verification_result,
            "match_score": self.match_score,
            "match_status": self.match_status,
            "message_count": len(self.messages)
        }


# ============== INTERROGATION MANAGER ==============
class InterrogationManager:
    """Manages all interrogation sessions."""
    
    def __init__(self):
        self.sessions: Dict[str, InterrogationSession] = {}
    
    def create_session(
        self,
        session_id: str,
        item_id: str,
        semantic_score: float = 0.0
    ) -> InterrogationSession:
        """Create a new interrogation session."""
        session = InterrogationSession(
            session_id=session_id,
            item_id=item_id,
            semantic_score=semantic_score
        )
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[InterrogationSession]:
        """Get an existing session."""
        return self.sessions.get(session_id)
    
    def start_interrogation(self, session_id: str) -> dict:
        """Start an interrogation and get opening message."""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        opening = session.get_opening_message()
        session.messages.append({"role": "assistant", "content": opening})
        
        return {
            "session_id": session_id,
            "item_id": session.item_id,
            "character_name": session.persona.get("character_name"),
            "message": opening,
            "trust_score": session.trust_score,
            "status": "started"
        }
    
    def send_message(self, session_id: str, message: str) -> dict:
        """Send a message in an interrogation session."""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        # Check for special commands
        if message.lower().strip() in ["no photo", "skip", "i don't have a photo", "no"]:
            if session.verification_requested:
                return session.skip_verification()
        
        return session.process_message(message)
    
    def submit_photo(self, session_id: str, photo_url: str) -> dict:
        """Submit a verification photo."""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        return session.submit_verification_photo(photo_url)
    
    def get_transcript(self, session_id: str) -> dict:
        """Get the full transcript for a session."""
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        return {
            "session_id": session_id,
            "transcript": session.get_transcript(),
            "summary": session.get_summary()
        }


# Global manager instance
interrogation_manager = InterrogationManager()


def get_interrogation_manager() -> InterrogationManager:
    """Get the global interrogation manager."""
    return interrogation_manager
