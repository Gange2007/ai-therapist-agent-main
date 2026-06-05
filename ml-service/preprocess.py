import re
import string
from typing import List


def clean_text(text: str) -> str:
    """
    Clean and preprocess text data.
    
    Args:
        text: Raw text string
        
    Returns:
        Cleaned text string
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove numbers
    text = re.sub(r'\d+', '', text)
    
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # Remove extra whitespace
    text = ' '.join(text.split())
    
    return text


def preprocess_texts(texts: List[str]) -> List[str]:
    """
    Preprocess a list of texts.
    
    Args:
        texts: List of raw text strings
        
    Returns:
        List of cleaned text strings
    """
    return [clean_text(text) for text in texts]
