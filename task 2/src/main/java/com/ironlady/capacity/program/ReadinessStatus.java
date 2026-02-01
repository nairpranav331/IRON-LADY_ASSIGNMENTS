package com.ironlady.capacity.program;

public enum ReadinessStatus {
  READY("Ready"),
  AT_RISK("At Risk"),
  OVERLOADED("Overloaded");

  private final String label;

  ReadinessStatus(String label) {
    this.label = label;
  }

  public String getLabel() {
    return label;
  }
}
