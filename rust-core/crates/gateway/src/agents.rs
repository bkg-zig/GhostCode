use axum::{
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use helper_core::agents::{AdviceLevel, AgentAdvice, AgentEvent, LiveAdvisor};
use helper_core::planner::{plan_action, ChatContext, PlanResponse};
use serde::Deserialize;

use crate::{AppError, AppResult, AppState};

#[derive(Deserialize)]
pub struct ChatPlanRequest {
    pub prompt: String,
    pub context: Option<String>,
}

pub async fn chat_plan(
    State(_state): State<AppState>,
    Json(req): Json<ChatPlanRequest>,
) -> AppResult<Json<PlanResponse>> {
    let context = ChatContext::new(req.prompt, req.context);
    let response = plan_action(&context)
        .await
        .map_err(|err| AppError::bad_request(format!("planner error: {}", err)))?;
    Ok(Json(response))
}

pub async fn agent_ws(ws: WebSocketUpgrade, State(_state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(|mut socket| async move {
        use axum::extract::ws::Message;
        use futures::StreamExt;

        let mut advisor = LiveAdvisor::new();

        while let Some(Ok(Message::Text(msg))) = socket.next().await {
            let event = match serde_json::from_str::<AgentEvent>(&msg) {
                Ok(event) => event,
                Err(err) => {
                    let error_advice = AgentAdvice {
                        content: format!("Invalid agent event payload: {}", err),
                        level: AdviceLevel::Error,
                        timestamp: Utc::now(),
                    };
                    if socket
                        .send(Message::Text(
                            serde_json::to_string(&error_advice).unwrap_or_else(|_| {
                                "{\"content\":\"error\",\"level\":\"error\",\"timestamp\":\"\"}"
                                    .to_string()
                            }),
                        ))
                        .await
                        .is_err()
                    {
                        break;
                    }
                    continue;
                }
            };

            match advisor.handle_event(event).await {
                Ok(Some(advice)) => {
                    if socket
                        .send(Message::Text(serde_json::to_string(&advice).unwrap()))
                        .await
                        .is_err()
                    {
                        break;
                    }
                }
                Ok(None) => continue,
                Err(err) => {
                    let error_advice = AgentAdvice {
                        content: format!("Advisor error: {}", err),
                        level: AdviceLevel::Error,
                        timestamp: Utc::now(),
                    };
                    if socket
                        .send(Message::Text(serde_json::to_string(&error_advice).unwrap()))
                        .await
                        .is_err()
                    {
                        break;
                    }
                }
            }
        }
    })
}
