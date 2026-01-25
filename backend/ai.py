import os
import json
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def generate_item_ai_data(
    item_name: str,
    description: Optional[str] = None,
    category: Optional[str] = None,
    location_name: Optional[str] = None,
    location_description: Optional[str] = None,
    notes: Optional[str] = None,
    image_urls: Optional[List[str]] = None
) -> Dict:
    """
    Generate AI data for an item using OpenRouter LLM.

    This function analyzes the item details and images to generate:
    - vector_context: Rich description for embedding
    - blind_lineup_display: Public teaser without identifying info
    - persona_engine: Character/personality for chat interactions

    Returns a dictionary with the structured AI data.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")

    # Build the context from all available information
    context_parts = []
    if item_name:
        context_parts.append(f"Item Name: {item_name}")
    if category:
        context_parts.append(f"Category: {category}")
    if description:
        context_parts.append(f"Description: {description}")
    if location_name:
        context_parts.append(f"Location: {location_name}")
    if location_description:
        context_parts.append(f"Location Details: {location_description}")
    if notes:
        context_parts.append(f"Additional Notes: {notes}")

    item_context = "\n".join(context_parts)

    # Build the message content with images if available
    user_content = []

    # Add text prompt
    user_content.append({
        "type": "text",
        "text": f"""Analyze this lost item and generate structured data for our lost-and-found matching system.

ITEM INFORMATION:
{item_context}

Based on all available information (and any images provided), generate a JSON response with EXACTLY this structure:

{{
  "vector_context": {{
    "rich_description": "A dense, factual paragraph combining visual details and inferred context. This will be passed to an Embedding Model for semantic matching. Include colors, materials, condition, distinguishing features, brand if visible, size, and any unique characteristics. Example: 'A black iPhone 14 with a spiderweb crack on the top-left corner. It has a red bumper case and a sticker of a cat on the back. Found in a study environment.'"
  }},

  "blind_lineup_display": {{
    "public_teaser": "A mysterious, 5-10 word hint for the public 'Lineup' card. It must NOT reveal unique identifiers. Bad: 'iPhone with cat sticker'. Good: 'A damaged smartphone with a playful decoration.'",
    "blur_reason": "A short, playful justification for why details are hidden. Examples: 'Bio-metric lock engaged', 'Too shy to show face', 'Identity protection protocol active', 'Mystery must be preserved'."
  }},

  "persona_engine": {{
    "archetype": "The personality vibe/type. Examples: 'The Grumpy Veteran', 'The Eager Puppy', 'The Snooty Aristocrat', 'The Mysterious Stranger', 'The Anxious Academic'.",
    "character_name": "A creative, punny nickname based on the item. Examples: 'Shattered Steve' (cracked phone), 'Lord Wallet', 'Captain Keys', 'Professor Pages' (book).",
    "secret_knowledge": "The ONE specific visual detail that proves ownership. This is what the real owner would know. Examples: 'The cat sticker on the back', 'The scratch over the Apple logo', 'The coffee stain on page 42'.",
    "system_instruction": "A detailed system prompt for the chatbot. Define the personality, speaking style, and strictly forbid revealing the 'secret_knowledge' directly. Instruct the bot to ask leading questions to verify ownership without giving away the secret. Include the character voice and how they should respond to correct/incorrect guesses.",
    "opening_line": "The very first message the item sends when chat opens. It should be in character, intriguing, and subtly challenge the user to prove ownership. Examples: 'My screen hurts... do you know why?', 'I've been waiting. Can you tell me about my favorite decoration?'"
  }}
}}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks
- Be creative with the persona but keep it appropriate
- The secret_knowledge should be something only the real owner would know
- Make the public_teaser intriguing but not identifying
- The system_instruction should be comprehensive enough to run a verification chat"""
    })

    # Add images if available
    if image_urls:
        for img_url in image_urls[:4]:  # Limit to 4 images
            user_content.append({
                "type": "image_url",
                "image_url": {"url": img_url}
            })

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/AndrewKaranu/SherLostHolmes",
    }

    payload = {
        "model": "openai/gpt-4o-mini",  # Vision-capable model
        "messages": [
            {
                "role": "system",
                "content": "You are an expert at analyzing lost items and creating engaging, mysterious personas for a lost-and-found gamification system. You analyze images and descriptions to generate structured data. Always respond with valid JSON only."
            },
            {
                "role": "user",
                "content": user_content
            }
        ],
        "temperature": 0.7,
        "max_tokens": 1500,
    }

    try:
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers, timeout=60)
        response.raise_for_status()

        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            ai_message = data["choices"][0]["message"]["content"]

            # Clean up the response (remove markdown code blocks if present)
            ai_message = ai_message.strip()
            if ai_message.startswith("```json"):
                ai_message = ai_message[7:]
            if ai_message.startswith("```"):
                ai_message = ai_message[3:]
            if ai_message.endswith("```"):
                ai_message = ai_message[:-3]
            ai_message = ai_message.strip()

            # Parse the JSON response
            result = json.loads(ai_message)
            return result
        else:
            raise ValueError("Unexpected response format from OpenRouter API")

    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to connect to OpenRouter API: {str(e)}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        raise ValueError(f"AI generation error: {str(e)}")


def test_openrouter_connection():
    # Test if API key is loaded and connection works
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {"status": "error", "message": "API key not found in .env file"}
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": "Say 'Connection successful' if you can read this."
            }
        ],
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            ai_message = data["choices"][0]["message"]["content"]
            return {
                "status": "success",
                "message": "API connection working!",
                "api_response": ai_message,
                "api_key_loaded": True
            }
        else:
            return {"status": "error", "message": "Unexpected response format"}
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"Connection failed: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Error: {str(e)}"}


def get_sherlock_deduction(lost_item_description: str, candidate_matches: List[Dict]) -> Dict:
    # Get API key from env
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set. Please check your .env file.")
    
    prompt = build_sherlock_prompt(lost_item_description, candidate_matches)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/AndrewKaranu/SherLostHolmes",
    }
    
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are Sherlock Holmes, the master detective. Provide detailed, logical deductions in your characteristic style. Be precise, observant, and methodical. Format your response as an evidence board with clear reasoning."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        if "choices" in data and len(data["choices"]) > 0:
            ai_message = data["choices"][0]["message"]["content"]
            matched_item_id = extract_item_id(ai_message, candidate_matches)
            
            return {
                "deduction": ai_message,
                "matched_item_id": matched_item_id,
                "confidence": "high" if matched_item_id else "uncertain"
            }
        else:
            raise ValueError("Unexpected response format from OpenRouter API")
            
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to connect to OpenRouter API: {str(e)}")
    except KeyError as e:
        raise ValueError(f"Unexpected response structure from OpenRouter: {str(e)}")


def build_sherlock_prompt(lost_item_description: str, candidate_matches: List[Dict]) -> str:
    # Build candidate list
    candidates_text = ""
    for idx, candidate in enumerate(candidate_matches, 1):
        candidate_id = candidate.get("id", f"Item {idx}")
        candidate_desc = candidate.get("description", "No description available")
        candidate_location = candidate.get("location", "Unknown location")
        candidate_date = candidate.get("found_date", "Unknown date")
        
        candidates_text += f"\n[Candidate #{idx} - ID: {candidate_id}]\n"
        candidates_text += f"Description: {candidate_desc}\n"
        candidates_text += f"Location Found: {candidate_location}\n"
        candidates_text += f"Date Found: {candidate_date}\n"
    
    prompt = f"""A new case has arrived at 221B Baker Street.

THE CASE:
A person has reported a lost item with the following description:
"{lost_item_description}"

EVIDENCE BOARD - CANDIDATE ITEMS:
The following items have been found and may match the lost item:
{candidates_text}

YOUR TASK:
Analyze the evidence with your characteristic attention to detail. Compare the lost item description with each candidate. Consider:
- Physical characteristics and details
- Location context
- Temporal proximity
- Any distinctive features mentioned

Provide your deduction in the style of an evidence board:
1. OBSERVATIONS: What key details do you notice?
2. ANALYSIS: How do the candidates compare to the lost item?
3. DEDUCTION: Which candidate (if any) is most likely a match? Provide the candidate number/ID.
4. REASONING: Explain your logic step-by-step, as you would to Dr. Watson.

Format your response clearly, as if presenting evidence to a client."""
    
    return prompt


def extract_item_id(ai_response: str, candidate_matches: List[Dict]) -> Optional[str]:
    # Try to find candidate number or ID in the response
    import re
    
    match = re.search(r'[Cc]andidate\s*#?\s*(\d+)', ai_response)
    if match:
        candidate_num = int(match.group(1))
        if 1 <= candidate_num <= len(candidate_matches):
            return candidate_matches[candidate_num - 1].get("id")
    
    # Check for explicit ID mentions
    for candidate in candidate_matches:
        candidate_id = str(candidate.get("id", ""))
        if candidate_id and candidate_id.lower() in ai_response.lower():
            return candidate_id
    
    return None
