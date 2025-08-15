# Temperature Settings in Qwen API Proxy

The Qwen API proxy supports the `temperature` parameter for controlling the randomness of model responses, following the OpenAI API standard.

## How Temperature Works

Temperature is a parameter that controls the randomness of the model's output:
- **Lower values (e.g., 0.1)**: Make the model more deterministic and predictable
- **Higher values (e.g., 0.9)**: Make the model more random and creative
- **Default value**: 1.0 (if not specified)

## Supported Range

The Qwen API proxy accepts temperature values in the range:
- **Minimum**: 0.0 (most deterministic)
- **Maximum**: 2.0 (most random)
- **Default**: 1.0

## How to Use Temperature

### In API Requests

Include the `temperature` parameter in your OpenAI-compatible requests:

```json
{
  "model": "qwen3-coder-plus",
  "messages": [
    {
      "role": "user",
      "content": "Write a creative story about a robot."
    }
  ],
  "temperature": 0.7
}
```

### Example Requests

1. **Deterministic response** (temperature = 0.1):
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-coder-plus",
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "temperature": 0.1
  }'
```

2. **Balanced creativity** (temperature = 0.7):
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-coder-plus",
    "messages": [{"role": "user", "content": "Write a short poem"}],
    "temperature": 0.7
  }'
```

3. **High creativity** (temperature = 1.5):
```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-coder-plus",
    "messages": [{"role": "user", "content": "Invent a new color and describe it"}],
    "temperature": 1.5
  }'
```

## Implementation Details

The temperature parameter is passed through directly to the Qwen API without modification:

1. Client sends request with temperature parameter to the proxy
2. Proxy forwards the temperature parameter to the Qwen API
3. Qwen API uses the temperature value to control response randomness
4. Response is returned to the client through the proxy

This maintains full compatibility with the OpenAI API standard while leveraging Qwen's native temperature controls.

## Best Practices

- Use **low temperature** (0.1-0.3) for factual responses, code generation, or when consistency is important
- Use **medium temperature** (0.4-0.7) for balanced responses that are both creative and coherent
- Use **high temperature** (0.8-1.5) for creative writing, brainstorming, or when you want varied responses
- Avoid **very high temperature** (>1.5) as it may produce incoherent outputs

## Testing Temperature Effects

You can test the temperature effects using the provided test script:
```bash
node tmp-test/test-temperature-comprehensive.js
```

This script demonstrates how different temperature values produce different levels of response variability.