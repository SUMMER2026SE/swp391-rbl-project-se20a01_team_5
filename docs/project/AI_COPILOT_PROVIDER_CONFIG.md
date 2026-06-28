# UniBus AI Copilot provider config

UniBus AI Copilot dùng `AiLlmService` router để chọn provider qua biến môi trường. Không commit API key vào repo.

## Z.ai free/light model

Khuyến nghị cho demo chi phí thấp:

```env
AI_ENABLED=true
AI_PROVIDER=zai
ZAI_BASE_URL=https://api.z.ai/api/paas/v4/
ZAI_MODEL_ID=glm-4.7-flash
ZAI_API_KEY=<set in local env or cloud secret>
AI_MAX_OUTPUT_TOKENS=1200
AI_TEMPERATURE=0.2
```

Ghi chú:

- `glm-4.7-flash` đang là lựa chọn free theo pricing docs tại thời điểm kiểm tra.
- Backend gửi `enable_thinking=false` và `thinking.type=disabled` để tránh response bị dồn vào `reasoning_content`.
- Nếu model free bị rate-limit hoặc chất lượng yếu, đổi `ZAI_MODEL_ID=glm-4.7-flashx`.

## AWS Bedrock fallback

Bedrock vẫn được giữ để đổi provider nhanh:

```env
AI_ENABLED=true
AI_PROVIDER=bedrock
AI_BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
AWS_REGION=ap-southeast-1
```

## API behavior

- Khi provider trả lời thành công, `ChatResponse.mode` là `ZAI` hoặc `BEDROCK`.
- Khi thiếu key, lỗi provider hoặc timeout, backend trả deterministic fallback với `mode=FALLBACK`.
- LLM chỉ nhận dữ liệu read-only đã retrieve từ backend context; không tự sinh SQL và không tự mutation đăng ký tuyến/mua vé.
