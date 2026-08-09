# PROMPT 4 — RAG Ingestion Pipeline
TASK 4 — Implement the RAG ingestion pipeline for curriculum data

TASK 4 — Implement the RAG ingestion pipeline for curriculum data.

This task comes AFTER:
- Task 1: LLM Provider Abstraction
- Task 2: Prompt Architecture
- Task 3: Structured Output + Validation

GOAL:

Build the curriculum ingestion pipeline described in the Technical Specification:

Curriculum JSON
→ chunking
→ embeddings
→ Qdrant

The goal is to make the curriculum searchable for semantic retrieval.

BEFORE CODING:

1. Inspect the existing Curriculum JSON.
2. Inspect its actual schema and structure.
3. Inspect existing Qdrant/vector database configuration.
4. Inspect installed embedding libraries/providers.
5. Inspect existing environment variables.
6. Do not assume the Curriculum JSON structure.
7. Do not invent fields that do not exist.
8. Reuse existing infrastructure where available.

IMPLEMENT:

1. Curriculum loader
   - Load curriculum.json from the project's configured location.
   - Validate the input structure.
   - Provide clear errors for malformed curriculum data.

2. Chunking pipeline
   - Convert curriculum content into meaningful retrieval chunks.
   - Preserve useful metadata such as:
     - topic
     - section
     - difficulty
     - source
     - curriculum identifiers
   - Only use metadata that actually exists in the provided curriculum.

3. Embedding generation
   - Create embeddings using the configured embedding provider.
   - Keep embedding provider abstraction separate from business logic.
   - Never hardcode API keys.

4. Qdrant storage
   - Create/use the appropriate Qdrant collection.
   - Store vectors and metadata.
   - Make collection configuration environment-driven where appropriate.

5. Idempotency
   - Running ingestion multiple times should not unnecessarily create duplicate records.
   - Use stable IDs or deterministic identifiers where appropriate.

6. Logging
   - Log useful ingestion progress.
   - Never log secrets.

7. Error handling
   - Handle malformed curriculum data.
   - Handle embedding failures.
   - Handle Qdrant connection failures.

IMPORTANT:

Do NOT implement semantic retrieval yet.

Do NOT implement question generation yet.

Do NOT implement evaluation or feedback.

PROJECT DEVELOPMENT GUIDELINES:

Apply the complete project guidelines:
- DRY
- SOLID
- KISS
- clean architecture
- modularity
- reusable services
- strict typing
- focused files
- production-quality code
- no unnecessary dependencies
- no dead code
- no magic values
- incremental changes

DOCUMENTATION:

Every source file must begin with a concise comment block explaining:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON FOCUS:

Use the provided synthetic Curriculum JSON.
Stay aligned with the Technical Specification.
Do not add unrelated functionality.

DELIVERABLE:

1. Show ingestion architecture.
2. List files created/modified.
3. Explain chunking strategy.
4. Explain metadata stored in Qdrant.
5. Explain how to run ingestion.
6. Add tests for curriculum loading/chunking where practical.
7. Run available tests/type checks/linting.
8. Report unresolved setup requirements.

# Semantic Retrieval + Context Assembly

TASK 5 — Implement semantic retrieval and context assembly for the RAG pipeline.

This task comes AFTER:
- Task 4: RAG Ingestion Pipeline

GOAL:

Implement:

User/Agent Query
→ Embedding
→ Qdrant semantic search
→ Relevant curriculum chunks
→ Context assembly

The retrieval layer must be reusable by question generation, follow-up generation, and evaluation/feedback workflows where required.

BEFORE CODING:

1. Inspect the completed ingestion pipeline.
2. Inspect Qdrant collection configuration.
3. Inspect the actual Curriculum JSON metadata.
4. Inspect Technical Specification.
5. Do not invent metadata fields.

IMPLEMENT:

1. Retrieval service
   - Accept a natural-language query.
   - Generate its embedding.
   - Search Qdrant semantically.
   - Return the most relevant curriculum chunks.

2. Retrieval configuration
   - Make top-k configurable.
   - Keep thresholds/configuration centralized.
   - Avoid magic numbers.

3. Metadata filtering
   - Support curriculum metadata filtering only where the existing curriculum supports it.
   - Do not create fake filters.

4. Context assembly
   - Convert retrieved chunks into clean context for the LLM.
   - Preserve source information.
   - Avoid unnecessary duplicated context.
   - Respect context size limitations.

5. Retrieval result model
   Create a strongly typed result structure containing relevant information such as:
   - content
   - score
   - metadata/source

6. Empty retrieval
   - Handle zero relevant results gracefully.
   - Do not fabricate curriculum context.

7. Error handling
   - Qdrant unavailable
   - embedding failure
   - invalid query
   - collection missing

8. Keep retrieval independent from question-generation business logic.

Do NOT implement:
- Question generation
- Follow-up generation
- Answer evaluation
- Feedback generation

PROJECT DEVELOPMENT GUIDELINES:

Apply the complete project guidelines:
DRY, SOLID, KISS, clean architecture, modular reusable code, strict typing, focused files, no unnecessary complexity, production-quality implementation, proper error handling, no dead code, no magic values.

DOCUMENTATION:

Every source file must begin with a concise comment block explaining:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON SCOPE:

Stay aligned with:
- Technical Specification
- Curriculum JSON
- Candidate Profiles

Do not implement out-of-scope features.

DELIVERABLE:

- Show retrieval architecture.
- List modified/created files.
- Explain query → embedding → Qdrant → context flow.
- Add retrieval tests where practical.
- Test empty retrieval behavior.
- Run tests/type checks/linting.

# 6 — Question Generation

TASK 6 — Implement AI-powered interview question generation.

This task comes AFTER:
- LLM Provider Abstraction
- Prompt Architecture
- Structured Output Infrastructure
- RAG Ingestion
- Semantic Retrieval + Context Assembly

GOAL:

Implement the question-generation pipeline:

QuestionStrategy
+
Retrieved Curriculum Context
+
Candidate Profile
→
LLM
→
Polished Interview Question

REQUIREMENTS:

1. Create a strongly typed QuestionStrategy model based on the existing Technical Specification.

2. Question generation must use:
   - question strategy
   - relevant curriculum context
   - candidate profile information where applicable
   - interviewer/system instructions

3. Use the existing ChatProvider abstraction.

4. Use the centralized prompt architecture.

5. Use the RAG retrieval service to retrieve relevant curriculum context.

6. Generate a clear, technically appropriate interview question.

7. Prevent hallucinated curriculum facts.
   The question should be grounded in retrieved curriculum context.

8. Keep question generation deterministic in structure even if wording differs.

9. Validate generated output where structured output is required.

10. Handle:
   - LLM failures
   - empty retrieval
   - malformed responses
   - invalid strategy
   - missing candidate data

11. Keep the service independent from HTTP/API routing.

12. Do not put provider-specific code in the question-generation service.

IMPORTANT:

Do NOT implement follow-up generation in this task.

Do NOT implement answer evaluation.

Do NOT implement feedback generation.

PROJECT DEVELOPMENT GUIDELINES:

Apply all project guidelines:
- DRY
- SOLID
- KISS
- clean architecture
- modularity
- reusable services
- strict typing
- no unnecessary dependencies
- small focused files
- production-quality implementation
- proper loading/error/empty handling
- no dead code
- no magic values
- incremental implementation

DOCUMENTATION:

Every source file must begin with a concise comment block explaining:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON FOCUS:

The implementation must follow the Technical Specification, Curriculum JSON, and Candidate Profiles.

Do not implement:
- Voice Interaction
- Authentication
- Persistent User Accounts
- Long-Term Conversation History
- Mobile Application

DELIVERABLE:

1. List created/modified files.
2. Explain the complete question-generation flow.
3. Explain how RAG context reaches the prompt.
4. Add unit tests for the service.
5. Add tests for empty/failed retrieval and LLM failure.
6. Run tests/type checks/linting.

# 7 — Follow-up Question Generation

TASK 7 — Implement adaptive follow-up question generation.

This task comes AFTER Task 6 — Question Generation.

GOAL:

Implement:

FollowUpStrategy
+
Previous Candidate Answer
+
Retrieved Curriculum Context
+
Relevant Interview Context
→
LLM
→
Probing Follow-up Question

REQUIREMENTS:

1. Create a strongly typed FollowUpStrategy based on the Technical Specification.

2. Accept:
   - follow-up strategy
   - previous answer
   - retrieved curriculum context
   - relevant question/context information

3. Use the existing ChatProvider abstraction.

4. Use centralized prompt builders.

5. Use RAG retrieval to obtain relevant curriculum context.

6. The follow-up must be genuinely based on the candidate's previous answer.

7. The system should be able to probe:
   - missing concepts
   - weak technical reasoning
   - shallow explanation
   - unclear assumptions
   - relevant edge cases

8. Do not generate random unrelated questions.

9. Do not invent curriculum facts.

10. Handle empty/poor answers gracefully.

11. Keep follow-up generation separate from answer evaluation logic.

12. Return a clean strongly typed result.

13. Handle LLM failure and retrieval failure.

IMPORTANT:

Do NOT implement the answer evaluator in this task.

Do NOT implement feedback generation.

PROJECT DEVELOPMENT GUIDELINES:

Apply the complete project guidelines:
DRY, SOLID, KISS, clean architecture, modularity, strict typing, reusable services, focused files, no unnecessary dependencies, production-quality code, proper error handling, no dead code, no magic values.

DOCUMENTATION:

Every source file must begin with:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON SCOPE:

Stay aligned with Technical Specification, Curriculum JSON, and Candidate Profiles.

Do not implement:
- Voice
- Authentication
- Persistent Accounts
- Long-Term Conversation History
- Mobile Application

DELIVERABLE:

- List modified/created files.
- Explain adaptive follow-up flow.
- Explain how previous answer influences the generated question.
- Add unit tests.
- Test empty answer, retrieval failure, and LLM failure.
- Run tests/type checks/linting.

# 8 — Answer Evaluation

TASK 8 — Implement the AI-powered interview answer evaluation system.

This task comes AFTER:
- Task 3 Structured Output
- Task 5 RAG Retrieval
- Task 6 Question Generation
- Task 7 Follow-up Generation

GOAL:

Implement rubric-based candidate answer evaluation.

The evaluator must produce a deterministic structured result even though the reasoning is performed by an LLM.

EXPECTED STRUCTURE:

{
  score,
  conceptCoverage,
  technicalAccuracy,
  depth,
  strengths,
  gaps,
  followUpRequired
}

Use the exact naming/types required by the Technical Specification if they differ from the example above.

INPUTS SHOULD INCLUDE:

- interview question
- candidate answer
- relevant curriculum context
- candidate profile where applicable
- evaluation rubric
- previous relevant interview context where required

REQUIREMENTS:

1. Create a dedicated evaluation service.
2. Use centralized evaluator prompts.
3. Use the ChatProvider abstraction.
4. Use Pydantic/structured-output validation.
5. Validate every generated evaluation.
6. Use a deterministic fallback if the LLM fails.
7. Never fabricate candidate strengths/gaps.
8. Keep scoring rules explicit and testable.
9. Separate:
   - LLM reasoning
   - schema validation
   - score normalization
   - fallback logic

The evaluation should consider:

- conceptual correctness
- technical accuracy
- coverage of required concepts
- depth of explanation
- quality of reasoning

The system should identify:

- strengths
- gaps
- whether a follow-up is required

IMPORTANT:

Do not create follow-up questions in this service.

This service should only determine whether follow-up is required.

Follow-up generation remains the responsibility of the follow-up service.

PROJECT DEVELOPMENT GUIDELINES:

Apply the complete project guidelines:
- DRY
- SOLID
- KISS
- clean architecture
- strict typing
- modularity
- reusable code
- focused files
- no `any` unless unavoidable
- no unnecessary dependencies
- production-quality implementation
- proper error handling
- no dead code
- no magic values

DOCUMENTATION:

Every source file must begin with:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON FOCUS:

Follow Technical Specification, Curriculum JSON, Candidate Profiles, and judging criteria.

Do not implement out-of-scope features.

DELIVERABLE:

1. Implement evaluation service.
2. Implement evaluation schemas.
3. Implement fallback behavior.
4. Add comprehensive unit tests.
5. Test:
   - correct answer
   - partially correct answer
   - incorrect answer
   - shallow answer
   - empty answer
   - malformed LLM response
   - LLM failure
6. Run tests/type checking/linting.
7. Explain the scoring architecture.

# 9 — Feedback Generation

TASK 9 — Implement AI-powered interview feedback generation.

This task comes AFTER:
- Answer Evaluation
- Question Generation
- Follow-up Generation
- RAG Retrieval

GOAL:

Create the feedback synthesis pipeline:

Evaluations
+
Curriculum Coverage
+
Candidate Profile
+
Missed Concepts
→
LLM
→
Structured Feedback

EXPECTED OUTPUT:

{
  summary,
  strengths,
  gaps,
  next
}

Use the exact schema required by the Technical Specification if different.

REQUIREMENTS:

1. Create a dedicated feedback-generation service.
2. Use the existing ChatProvider abstraction.
3. Use centralized feedback prompts.
4. Use structured output validation.
5. Synthesize feedback from evaluation results.
6. Consider curriculum coverage.
7. Identify missed concepts.
8. Consider candidate profile information where relevant.
9. Do not invent facts about the candidate.
10. Feedback should be actionable and interview-focused.

The feedback should communicate:

SUMMARY:
- Overall performance summary.

STRENGTHS:
- What the candidate did well.

GAPS:
- Concepts or reasoning that need improvement.

NEXT:
- Concrete next learning/interview steps.

IMPORTANT:

Do not duplicate evaluation logic.

The feedback service should consume evaluation results rather than independently re-evaluating the candidate.

Handle:
- missing evaluation data
- empty strengths/gaps
- LLM failure
- malformed output
- validation failure

Use deterministic fallback behavior where appropriate.

PROJECT DEVELOPMENT GUIDELINES:

Apply the complete project guidelines:
DRY, SOLID, KISS, clean architecture, modularity, strict typing, focused files, reusable services, no unnecessary dependencies, production-quality code, no dead code, no magic values, proper error handling.

DOCUMENTATION:

Every source file must begin with:
- Purpose
- Responsibilities
- Connected/Dependent files
- Important implementation notes

HACKATHON FOCUS:

Stay strictly aligned with:
- Technical Specification
- Curriculum JSON
- Candidate Profiles
- Interview Agent judging criteria

Do not implement Voice Interaction, Authentication, Persistent Accounts, Long-Term Conversation History, or Mobile Application support.

DELIVERABLE:

1. Implement feedback service.
2. Implement schemas.
3. Add fallback behavior.
4. Add tests.
5. Test valid evaluation input and failure cases.
6. Run tests/type checking/linting.
7. Explain the evaluation → feedback flow.

