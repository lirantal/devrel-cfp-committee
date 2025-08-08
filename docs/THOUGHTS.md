## Future Considerations: Normalizing Evaluation Tables for Flexibility

To support a wide variety of evaluation types (e.g., speaker, session, topic, etc.) without creating a separate table for each, consider a normalized schema that separates evaluation metadata from individual evaluation results. This approach enables extensibility and consistency across all evaluation workflows.

### Current Table Example

**`evaluations_speakers_profile`**  
- `id`: UUID (primary key)
- `speaker_id`: Foreign key to `speakers.id`
- `profile_url`: Text
- `evaluations_expertise_match`: Number (e.g., 1–5)
- `evaluations_expertise_match_justification`: Text
- `evaluations_topics_relevance`: Number (e.g., 1–5)
- `evaluations_topics_relevance_justification`: Text
- `evaluations_data`: Text (JSON blob of all evaluation data)
- `created_at`: Timestamp

*Limitation: This table is specific to speaker profile evaluations and does not generalize to other evaluation types.*

---

### Proposed Normalized Schema

#### 1. `evaluations`  
Stores metadata about each evaluation event, regardless of type.

- `id`: UUID (primary key)
- `speaker_id`: Foreign key to `speakers.id` (nullable, for non-speaker evaluations)
- `evaluation_type`: Text (e.g., `'speaker-evaluation'`, `'session-evaluation'`)
- `created_at`: Timestamp

#### 2. `evaluations_results`  
Stores individual results for each evaluation, allowing multiple named results per evaluation.

- `id`: UUID (primary key)
- `evaluations_id`: Foreign key to `evaluations.id`
- `evaluation_name`: Text (e.g., `'expertise-match'`, `'topics-relevance'`)
- `evaluation_score`: Number (e.g., 1–5)
- `evaluation_justification`: Text
- `created_at`: Timestamp

*Primary key can be composite: (`id`, `evaluations_id`), ensuring uniqueness and referential integrity.*

---

### Benefits

- **Extensible**: Add new evaluation types or result categories without schema changes.
- **Consistent**: All evaluations (speaker, session, etc.) follow the same structure.
- **Queryable**: Easily aggregate or filter results by type, name, or entity.
- **No Redundancy**: Avoids proliferation of single-purpose tables.

---

### Example Usage

- A single `evaluations` record can represent a speaker or session evaluation.
- Multiple `evaluations_results` records can be linked to one evaluation, each representing a different aspect (e.g., expertise, relevance, originality).
- Additional metadata (e.g., `profile_url`) can be stored in a JSON column or a related table if needed.

---