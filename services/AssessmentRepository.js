import { Assessment } from "../models/Assessment.js";

const DEFAULT_QUESTION_BANK_INDEX_URL = "./question-banks/index.json";

/** Load assessments from configured question sources. */
export class AssessmentRepository {
  /** Create caches and source handlers for assessment loading. */
  constructor() {
    this.assessmentCache = new Map();
    this.assessmentIndexCache = new Map();
    this.sources = {
      default_bank: {
        loadAssessment: (assessmentId) =>
          this._loadDefaultBankAssessment(assessmentId),
        loadIndex: () => this._loadDefaultBankIndex(),
      },
      database: {
        loadAssessment: (assessmentId) =>
          this._loadDatabaseAssessment(assessmentId),
        loadIndex: () => this._loadDatabaseIndex(),
      },
    };
  }

  /** Load and cache a single assessment from the requested source. */
  async fetchAssessment(assessmentId, source = "default_bank") {
    const cacheKey = `${source}:${assessmentId}`;

    if (this.assessmentCache.has(cacheKey)) {
      return new Assessment(this.assessmentCache.get(cacheKey));
    }

    const sourceLoader = this.sources[source];

    if (!sourceLoader) {
      throw new Error(`Unknown question source: ${source}`);
    }

    const assessmentData = await sourceLoader.loadAssessment(assessmentId);

    if (!assessmentData) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }

    this.assessmentCache.set(cacheKey, assessmentData);

    return new Assessment(assessmentData);
  }

  /** Load and cache the list of available assessments for a source. */
  async fetchAssessmentIndex(source = "default_bank") {
    if (this.assessmentIndexCache.has(source)) {
      return this.assessmentIndexCache.get(source);
    }

    const sourceLoader = this.sources[source];

    if (!sourceLoader) {
      throw new Error(`Unknown question source: ${source}`);
    }

    const assessmentIndex = await sourceLoader.loadIndex();
    this.assessmentIndexCache.set(source, assessmentIndex);
    return assessmentIndex;
  }

  /** Resolve default-bank metadata, then fetch the matching assessment JSON. */
  async _loadDefaultBankAssessment(assessmentId) {
    if (!assessmentId) {
      throw new Error("assessmentId is required");
    }

    const assessmentIndex = await this.fetchAssessmentIndex("default_bank");
    const assessmentMeta = assessmentIndex.find(
      (assessment) => assessment.id === assessmentId,
    );

    if (!assessmentMeta) {
      throw new Error(`Assessment not found: ${assessmentId}`);
    }

    return this._fetchJson(
      assessmentMeta.url,
      `Failed to fetch assessment ${assessmentId}`,
    );
  }

  /** Load the default question-bank index JSON. */
  async _loadDefaultBankIndex() {
    return this._fetchJson(
      DEFAULT_QUESTION_BANK_INDEX_URL,
      "Failed to fetch assessment index",
    );
  }

  /** Fetch JSON and throw a source-specific error when the request fails. */
  async _fetchJson(url, errorMessage) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${errorMessage}: ${response.status}`);
    }

    return response.json();
  }

  /** Placeholder for loading an assessment from the database source. */
  async _loadDatabaseAssessment(assessmentId = null) {
    // to be implemented; shape must be aligned with Assessment dataclass
  }

  /** Placeholder for loading the database-backed assessment index. */
  async _loadDatabaseIndex() {
    // to be implemented; shape must be aligned with question-banks/index.json
  }
}
