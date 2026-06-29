from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize slowapi limiter based on IP address to protect backend endpoints
limiter = Limiter(key_func=get_remote_address)
