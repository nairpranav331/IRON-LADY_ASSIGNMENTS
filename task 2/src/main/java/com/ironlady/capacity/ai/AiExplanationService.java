package com.ironlady.capacity.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ironlady.capacity.program.ReadinessStatus;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AiExplanationService {
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public AiExplanationService(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newHttpClient();
  }

  public String generateExplanation(
      String programName,
      double enrollmentPercentage,
      double mentorLoadRatio,
      ReadinessStatus status
  ) {
    String apiKey = System.getenv("OPENAI_API_KEY");
    if (apiKey == null || apiKey.isBlank()) {
      return fallbackExplanation(enrollmentPercentage, mentorLoadRatio, status);
    }

    String model = System.getenv("OPENAI_MODEL");
    if (model == null || model.isBlank()) {
      model = "gpt-4o-mini";
    }

    String system = "You are an internal operations assistant for Iron Lady.\n"
        + "You explain operational readiness clearly and professionally.\n"
        + "You do not make decisions, only explain existing status.\n"
        + "Do not mention any external companies or tools.\n"
        + "Output plain text only, 1–2 lines.";

    String user = "Program name: " + programName + "\n"
        + "Enrollment percentage: " + enrollmentPercentage + "%\n"
        + "Mentor load ratio: " + mentorLoadRatio + "\n"
        + "Readiness status: " + status.getLabel() + "\n"
        + "Explain the readiness status in 1–2 lines.";

    try {
      String body = objectMapper.writeValueAsString(
          Map.of(
              "model", model,
              "temperature", 0.4,
              "messages", List.of(
                  Map.of("role", "system", "content", system),
                  Map.of("role", "user", "content", user)
              )
          )
      );

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://api.openai.com/v1/chat/completions"))
          .timeout(Duration.ofSeconds(15))
          .header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(body))
          .build();

      HttpResponse<String> resp = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
        return fallbackExplanation(enrollmentPercentage, mentorLoadRatio, status);
      }

      JsonNode root = objectMapper.readTree(resp.body());
      String content = root.path("choices").path(0).path("message").path("content").asText("");
      String cleaned = content == null ? "" : content.trim();

      if (cleaned.isEmpty()) {
        return fallbackExplanation(enrollmentPercentage, mentorLoadRatio, status);
      }

      return cleaned;
    } catch (Exception e) {
      return fallbackExplanation(enrollmentPercentage, mentorLoadRatio, status);
    }
  }

  private String fallbackExplanation(double enrollmentPercentage, double mentorLoadRatio, ReadinessStatus status) {
    if (status == ReadinessStatus.READY) {
      return "Capacity and mentor coverage look healthy. This program is on track for smooth delivery.";
    }

    if (status == ReadinessStatus.AT_RISK) {
      return "This program is nearing capacity or mentor load limits. Consider adding mentors or controlling new enrollments.";
    }

    return "This program is overloaded on capacity or mentor support. Pause enrollments or add mentors to protect delivery quality.";
  }
}
