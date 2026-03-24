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
    
    STRICT MODE: Only matches against ACTUALLY STORED item data.
    """
    llm = get_verification_llm()
    
    # Extract ONLY the actual stored item details - nothing fabricated
    description = item_data.get("description", "") or ""
    unique_features = item_data.get("unique_features", "") or ""
    ai_data = item_data.get("ai_data", {}) or {}
    persona = ai_data.get("persona_engine", {}) or {}
    # Secret knowledge should ONLY be the unique_features or what's explicitly stored
    secret_knowledge = unique_features if unique_features else persona.get("secret_knowledge", "")
    color = item_data.get("color", "") or ""
    brand = item_data.get("brand", "") or ""
    category = item_data.get("category", "") or ""
    
    # Build a strict list of verifiable facts
    verifiable_facts = []
    if description:
        verifiable_facts.append(f"Description: {description}")
    if unique_features:
        verifiable_facts.append(f"Unique Features: {unique_features}")
    if color:
        verifiable_facts.append(f"Color: {color}")
    if brand:
        verifiable_facts.append(f"Brand: {brand}")
    if category:
        verifiable_facts.append(f"Category: {category}")
    
    if not verifiable_facts:
        return False, 0.0, "No verifiable item data available"
    
    facts_str = "\n".join(f"- {fact}" for fact in verifiable_facts)
    
    # Log what we're verifying against to help debug
    print(f"[SEMANTIC CHECK] Verifying user message against ACTUAL stored data:")
    print(f"  User said: '{user_message[:100]}...'")
    print(f"  Stored facts: {verifiable_facts}")
    
    prompt = f"""You are a STRICT verification assistant. Determine if the user's message demonstrates knowledge that matches the ACTUAL stored item data below.

=== ACTUAL STORED ITEM DATA (ONLY USE THIS) ===
{facts_str}

=== USER'S CLAIM ===
"{user_message}"

=== STRICT VERIFICATION RULES ===
1. ONLY verify against the actual stored data above - do NOT invent or assume additional features
2. The user's description must reasonably match something in the stored data
3. Accept semantic equivalents (e.g., "crimson" = "red", "laptop computer" = "laptop")
4. Accept partial matches if they correctly identify stored features
5. Do NOT give credit for generic descriptions that could apply to any item
6. If the stored data is vague, be MORE lenient with the user's description

=== WHAT COUNTS AS A MATCH ===
- User mentions a color that matches or is similar to the stored color
- User mentions a brand that matches the stored brand
- User describes features that match the unique features or description
- User correctly identifies the category/type of item

=== WHAT DOES NOT COUNT ===
- Generic statements like "it's mine" or "I lost it"
- Features NOT mentioned in the stored data (don't assume)
- Vague descriptions that could match anything

Respond in this exact JSON format:
{{
    "is_match": true/false,
    "confidence": 0.0 to 1.0,
    "reasoning": "quote the SPECIFIC stored data that matched",
    "matched_features": ["list only features that exist in stored data"],
    "should_verify": true/false (true if confidence >= 0.4)
}}"""

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
        
        # Get actual item details for context - ONLY use what's actually stored
        item_description = self.item.get("description") or "No description available"
        item_color = self.item.get("color") or "unknown"
        item_brand = self.item.get("brand") or "unknown"
        item_category = self.item.get("category") or "item"
        item_unique_features = self.item.get("unique_features") or secret_knowledge or "no specific features recorded"
        item_location = self.item.get("location_name") or "unknown location"
        
        # Log what data we're actually using (helps debug hallucination issues)
        print(f"[INTERROGATION] Building prompt with ACTUAL stored data:")
        print(f"  - Description: {item_description[:100]}...")
        print(f"  - Color: {item_color}")
        print(f"  - Brand: {item_brand}")
        print(f"  - Unique Features: {item_unique_features[:100] if item_unique_features else 'None'}...")
        
        # Build comprehensive system prompt with item context
        # CRITICAL: Only include ACTUALLY STORED data to prevent hallucination
        base_prompt = f"""You are {character_name}, a lost {item_category} with the personality of {archetype}.

=== YOUR TRUE IDENTITY (ONLY THESE FACTS ARE TRUE) ===
- Category: {item_category}
- Description: {item_description}
- Color: {item_color}
- Brand: {item_brand}
- Location Found: {item_location}
- Unique Features: {item_unique_features}

=== CRITICAL ANTI-HALLUCINATION RULES ===
1. You ONLY know the facts listed above. Do NOT invent additional details.
2. If asked about something not in your data, say you don't remember or aren't sure.
3. NEVER claim to have features, marks, stickers, or details that aren't listed above.
4. If your unique features field is vague, keep your questions vague too.
5. DO NOT make up specific scratches, stickers, marks, or details.

=== VERIFICATION RULES ===
Someone claims to be your owner. ONLY verify against the ACTUAL data above.

When the user describes something that MATCHES your actual details:
1. Acknowledge they got it right (in character)
2. Become more trusting and warm
3. Move toward photo verification

DO NOT keep asking questions endlessly if they've demonstrated knowledge.

=== PERSONALITY ===
- Stay in character as {archetype}
- Start curious, warm up when they show real knowledge
- Keep responses short (2-3 sentences max)
- After correct details, ask for photo verification
- DO NOT invent new "tests" or "secret features" beyond your stored data

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

        # Detect if LLM asked for a photo even before secret_verified flag is set
        photo_keywords = ["photo", "picture", "upload", "image", "show me", "visual proof"]
        ai_lower = ai_message.lower()
        if any(kw in ai_lower for kw in photo_keywords) and self.trust_score >= 40:
            self.verification_requested = True
            self.secret_verified = True

        # Determine status
        if self.is_locked:
            status = "locked"
            can_continue = False
        elif self.secret_verified or self.verification_requested:
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
