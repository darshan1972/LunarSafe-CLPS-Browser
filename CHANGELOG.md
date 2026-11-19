## v2.1.0 - Hybrid Edition
- **Engine Hash Evolution:** The `imageProcessor.ts` engine hash changed from `8CA34C...` (original ISRO) to `A3BAF71C...` (NASA/Hybrid) because we updated the instrument labels to correctly identify ISRO Chandrayaan-2 vs NASA LRO data, and removed misleading ISRO default labels.
- **Test Updates:** `tests/isroFullPipeline.test.ts` was updated to expect the new `A3BAF71C...` hash so the ISRO pipeline tests can pass using the updated engine.
