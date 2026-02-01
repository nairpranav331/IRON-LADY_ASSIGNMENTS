package com.ironlady.capacity.program;

import com.ironlady.capacity.ai.AiExplanationService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProgramService {
  private final ProgramRepository programRepository;
  private final ReadinessCalculator readinessCalculator;
  private final AiExplanationService aiExplanationService;

  public ProgramService(
      ProgramRepository programRepository,
      ReadinessCalculator readinessCalculator,
      AiExplanationService aiExplanationService
  ) {
    this.programRepository = programRepository;
    this.readinessCalculator = readinessCalculator;
    this.aiExplanationService = aiExplanationService;
  }

  public ProgramResponse create(ProgramRequest request) {
    Program program = new Program();
    apply(program, request);
    Program saved = programRepository.save(program);
    return toResponse(saved, false);
  }

  public List<ProgramResponse> list() {
    return programRepository.findAll().stream().map(p -> toResponse(p, false)).toList();
  }

  public ProgramResponse getById(long id) {
    Program program = programRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found"));

    return toResponse(program, true);
  }

  public ProgramResponse update(long id, ProgramRequest request) {
    Program program = programRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found"));

    apply(program, request);
    Program saved = programRepository.save(program);
    return toResponse(saved, false);
  }

  public void delete(long id) {
    if (!programRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found");
    }
    programRepository.deleteById(id);
  }

  private void apply(Program program, ProgramRequest request) {
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing request body");
    }

    if (request.programName() == null || request.programName().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "programName is required");
    }

    int maxParticipants = requireInt(request.maxParticipants(), "maxParticipants");
    if (maxParticipants <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maxParticipants must be greater than 0");
    }

    int currentEnrollments = requireInt(request.currentEnrollments(), "currentEnrollments");
    if (currentEnrollments < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currentEnrollments must be 0 or greater");
    }

    int assignedMentors = requireInt(request.assignedMentors(), "assignedMentors");
    if (assignedMentors <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "assignedMentors must be greater than 0");
    }

    ProgramStatus status;
    try {
      status = ProgramStatus.fromLabel(request.status());
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    if (status == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
    }

    if (request.startDate() != null && request.endDate() != null && request.endDate().isBefore(request.startDate())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate must be on or after startDate");
    }

    program.setProgramName(request.programName().trim());
    program.setStartDate(request.startDate());
    program.setEndDate(request.endDate());
    program.setMaxParticipants(maxParticipants);
    program.setCurrentEnrollments(currentEnrollments);
    program.setAssignedMentors(assignedMentors);
    program.setStatus(status);
  }

  private int requireInt(Integer value, String field) {
    if (value == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
    }
    return value;
  }

  private ProgramResponse toResponse(Program program, boolean includeAiExplanation) {
    ReadinessResult readiness = readinessCalculator.calculate(
        program.getCurrentEnrollments(),
        program.getMaxParticipants(),
        program.getAssignedMentors()
    );

    String aiExplanation = null;
    if (includeAiExplanation) {
      aiExplanation = aiExplanationService.generateExplanation(
          program.getProgramName(),
          readiness.enrollmentPercentage(),
          readiness.mentorLoadRatio(),
          readiness.readinessStatus()
      );
    }

    return new ProgramResponse(
        program.getId(),
        program.getProgramName(),
        program.getStartDate(),
        program.getEndDate(),
        program.getMaxParticipants(),
        program.getCurrentEnrollments(),
        program.getAssignedMentors(),
        program.getStatus().getLabel(),
        readiness.enrollmentPercentage(),
        readiness.mentorLoadRatio(),
        readiness.readinessStatus().getLabel(),
        aiExplanation
    );
  }
}
