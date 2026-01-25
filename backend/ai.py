import os
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


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
