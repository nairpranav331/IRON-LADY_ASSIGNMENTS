package com.ironlady.capacity.program;

import java.util.Arrays;

public enum ProgramStatus {
  PLANNED("Planned"),
  ACTIVE("Active"),
  CLOSED("Closed");

  private final String label;

  ProgramStatus(String label) {
    this.label = label;
  }

  public String getLabel() {
    return label;
  }

  public static ProgramStatus fromLabel(String value) {
    if (value == null) {
      return null;
    }

    String trimmed = value.trim();
    if (trimmed.isEmpty()) {
      return null;
    }

    return Arrays.stream(values())
        .filter(s -> s.name().equalsIgnoreCase(trimmed) || s.label.equalsIgnoreCase(trimmed))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Invalid status: " + value));
  }
}
