"""
Embedding Module for SherLostHolmes
Handles text and multimodal embeddings via OpenRouter.
"""
import os
import json
import requests
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API Endpoints
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings"

# Embedding dimensions
TEXT_EMBEDDING_DIM = 1536  # text-embedding-3-small


def get_text_embedding(text: str, model: str = "openai/text-embedding-3-small") -> List[float]:
    """
    Generate text embedding using OpenRouter's embedding API.

    Args:
        text: The text to embed
        model: The embedding model to use (default: openai/text-embedding-3-small)

    Returns:
        List of floats representing the embedding vector
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/AndrewKaranu/SherLostHolmes",
    }

    payload = {
        "model": model,
        "input": text
    }

    try:
        response = requests.post(OPENROUTER_EMBEDDINGS_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()

        data = response.json()
        if "data" in data and len(data["data"]) > 0:
            return data["data"][0]["embedding"]
        else:
            raise ValueError("Unexpected response format from OpenRouter Embedding API")

    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to connect to OpenRouter Embedding API: {str(e)}")


def get_multimodal_embedding(
    text: Optional[str] = None,
    image_urls: Optional[List[str]] = None,
    model: str = "openai/gpt-4o-mini"
) -> Dict:
    """
    Generate multimodal embedding by first using a vision model to create
    a unified description of text and images, then embedding that description.

    This approach:
    1. Sends text + images to a vision model via OpenRouter
    2. Gets a rich, unified description combining all inputs
    3. Embeds the unified description for vector search

    Args:
        text: Text description to include
        image_urls: List of image URLs to analyze
        model: Vision model to use for multimodal analysis

    Returns:
        Dict with 'embedding' (list of floats) and 'unified_description' (str)
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set")

    if not text and not image_urls:
        raise ValueError("At least one of text or image_urls is required")

    # Step 1: Use vision model to create unified description
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/AndrewKaranu/SherLostHolmes",
    }

    # Build multimodal content
    user_content = []

    prompt_text = """Analyze the following item information and images to create a SINGLE, dense paragraph description optimized for semantic search and matching.

Your description should:
1. Combine ALL visual details from images (colors, materials, brand logos, damage, stickers, markings)
2. Include the text description details
3. Be factual and specific (no vague terms)
4. Focus on UNIQUE identifying features
5. Be 100-200 words

"""
    if text:
        prompt_text += f"TEXT DESCRIPTION:\n{text}\n\n"

    if image_urls:
        prompt_text += f"IMAGES: {len(image_urls)} image(s) provided below. Analyze each carefully.\n\n"

    prompt_text += "OUTPUT: Write ONLY the unified description paragraph, nothing else."

    user_content.append({
        "type": "text",
        "text": prompt_text
    })

    # Add images
    if image_urls:
        for url in image_urls[:4]:  # Limit to 4 images
            user_content.append({
                "type": "image_url",
                "image_url": {"url": url}
            })

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are an expert at analyzing items and creating detailed descriptions for a lost-and-found matching system. Be precise and factual."
            },
            {
                "role": "user",
                "content": user_content
            }
        ],
        "temperature": 0.3,
        "max_tokens": 500,
    }

    try:
        # Get unified description from vision model
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers, timeout=60)
        response.raise_for_status()

        data = response.json()
        if "choices" not in data or len(data["choices"]) == 0:
            raise ValueError("Unexpected response format from OpenRouter API")

        unified_description = data["choices"][0]["message"]["content"].strip()

        # Step 2: Embed the unified description
        embedding = get_text_embedding(unified_description)

        return {
            "embedding": embedding,
            "unified_description": unified_description,
            "model_used": model,
            "embedding_model": "openai/text-embedding-3-small"
        }

    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to connect to OpenRouter API: {str(e)}")


def generate_item_embeddings(
    rich_description: Optional[str] = None,
    image_urls: Optional[List[str]] = None,
    use_multimodal: bool = True
) -> Dict[str, Optional[any]]:
    """
    Generate embeddings for an item using text and/or images via OpenRouter.

    Args:
        rich_description: The AI-generated rich description of the item
        image_urls: List of image URLs for the item
        use_multimodal: Whether to use multimodal embedding (vision model + text embedding)

    Returns:
        Dictionary with:
        - text_embedding: Embedding of the rich description (1536-dim)
        - multimodal_embedding: Combined text+image embedding (1536-dim)
        - unified_description: The vision model's unified description
        - embedding_model: The model(s) used
        - embedding_error: Any error that occurred
    """
    result = {
        "text_embedding": None,
        "multimodal_embedding": None,
        "unified_description": None,
        "text_embedding_model": None,
        "multimodal_embedding_model": None,
        "embedding_error": None
    }

    # Generate text embedding from rich description
    if rich_description:
        try:
            result["text_embedding"] = get_text_embedding(rich_description)
            result["text_embedding_model"] = "openai/text-embedding-3-small"
        except Exception as e:
            result["embedding_error"] = f"Text embedding error: {str(e)}"

    # Generate multimodal embedding if enabled and we have content
    if use_multimodal and (rich_description or image_urls):
        try:
            multimodal_result = get_multimodal_embedding(
                text=rich_description,
                image_urls=image_urls[:4] if image_urls else None  # Limit to 4 images
            )

            result["multimodal_embedding"] = multimodal_result.get("embedding")
            result["unified_description"] = multimodal_result.get("unified_description")
            result["multimodal_embedding_model"] = f"{multimodal_result.get('model_used')} -> {multimodal_result.get('embedding_model')}"

        except Exception as e:
            error_msg = f"Multimodal embedding error: {str(e)}"
            if result["embedding_error"]:
                result["embedding_error"] += f" | {error_msg}"
            else:
                result["embedding_error"] = error_msg

    return result


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.

    Args:
        vec1: First embedding vector
        vec2: Second embedding vector

    Returns:
        Cosine similarity score between -1 and 1
    """
    if len(vec1) != len(vec2):
        raise ValueError(f"Vector dimensions must match: {len(vec1)} vs {len(vec2)}")

    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5

    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    return dot_product / (magnitude1 * magnitude2)


def test_embedding_connection() -> Dict:
    """
    Test if OpenRouter embedding APIs are properly configured and working.

    Returns:
        Dictionary with status of embedding services
    """
    result = {
        "text_embedding": {"status": "unknown", "message": ""},
        "multimodal_embedding": {"status": "unknown", "message": ""}
    }

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {
            "text_embedding": {"status": "error", "message": "OPENROUTER_API_KEY not set"},
            "multimodal_embedding": {"status": "error", "message": "OPENROUTER_API_KEY not set"}
        }

    # Test text embedding
    try:
        embedding = get_text_embedding("test item description")
        result["text_embedding"] = {
            "status": "success",
            "message": f"Working! Dimension: {len(embedding)}",
            "dimension": len(embedding),
            "model": "openai/text-embedding-3-small"
        }
    except Exception as e:
        result["text_embedding"] = {"status": "error", "message": str(e)}

    # Test multimodal (text only, no images for quick test)
    try:
        multimodal_result = get_multimodal_embedding(text="test item: a blue wallet with leather exterior")
        result["multimodal_embedding"] = {
            "status": "success",
            "message": f"Working! Dimension: {len(multimodal_result['embedding'])}",
            "dimension": len(multimodal_result["embedding"]),
            "unified_description_preview": multimodal_result["unified_description"][:100] + "...",
            "model": multimodal_result["model_used"]
        }
    except Exception as e:
        result["multimodal_embedding"] = {"status": "error", "message": str(e)}

    return result
