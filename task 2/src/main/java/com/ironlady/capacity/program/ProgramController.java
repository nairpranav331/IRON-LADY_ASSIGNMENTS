package com.ironlady.capacity.program;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/programs")
public class ProgramController {
  private final ProgramService programService;

  public ProgramController(ProgramService programService) {
    this.programService = programService;
  }

  @PostMapping
  public ResponseEntity<ProgramResponse> create(@RequestBody ProgramRequest request) {
    ProgramResponse created = programService.create(request);
    return ResponseEntity.status(201).body(created);
  }

  @GetMapping
  public List<ProgramResponse> list() {
    return programService.list();
  }

  @GetMapping("/{id}")
  public ProgramResponse getById(@PathVariable long id) {
    return programService.getById(id);
  }

  @PutMapping("/{id}")
  public ProgramResponse update(@PathVariable long id, @RequestBody ProgramRequest request) {
    return programService.update(id, request);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id) {
    programService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
