import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const submissionService = {

  /**
   * GET: Fetch single submission details
   * Path: /api/submission/{submission_id}/
   */
  getById: async (id) => {
    try {
      const url = API_ENDPOINTS.SUBMISSION.BY_ID(id);
      const res = await apiClient.get(url);
      return res.data;
    } catch (error) {
      console.error(`Fetch Submission ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST: Create a new submission record
   * Used for automated marks (earned_grade: 1 or 2)
   * Path: /api/submission
   */
  create: async (payload) => {
    try {
      const res = await apiClient.post(API_ENDPOINTS.SUBMISSION.BASE, payload);
      return res.data;
    } catch (error) {
      console.error("Create Submission Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * PUT: Update a specific submission
   * Path: /api/submission/{submission_id}
   */
  update: async (id, payload) => {
    try {
      const url = API_ENDPOINTS.SUBMISSION.BY_ID(id);
      const res = await apiClient.put(url, payload);
      return res.data;
    } catch (error) {
      console.error(`Update Submission ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST: Submit an existing attempt
   * Path: /api/submission/{submission_id}/submit
   */
  submitAttempt: async (id) => {
    try {
      const url = API_ENDPOINTS.SUBMISSION.SUBMIT_ATTEMPT(id);
      const res = await apiClient.post(url);
      return res.data;
    } catch (error) {
      console.error("Submit Attempt Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * POST: Mark a submission (Admin marking)
   */
  markSubmission: async (id, markData) => {
    try {
      // markData: { earned_grade, marking_remark }
      const url = API_ENDPOINTS.SUBMISSION.MARK(id);
      const res = await apiClient.post(url, markData);
      return res.data;
    } catch (error) {
      console.error("Marking Submission Error:", error.response?.data || error.message);
      throw error;
    }
  },

  // GET: Show the Submission By Element
  getByElement: async (enrollmentId, elementId) => {
    if(elementId===undefined){
      return [];
      console.log("Empty");
    }
    try {
      const url = API_ENDPOINTS.SUBMISSION.GET_BY_ELEMENT(enrollmentId, elementId);
      const res = await apiClient.get(url);
      return res.data;
    } catch (error) {
      console.error(
        "Fetch Element Submissions Error:", 
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
     * GET: Fetch submission summaries
     */
    getSummaries: async (page = 1, size = 10, searchQuery = '', status = 'All', sortConfig = null) => {
      try {
          const params = { 
              page: Number(page), 
              size: Number(size) 
          };

          if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
              params.search = searchQuery.trim();
          }
          if (status && status !== 'All' && typeof status === 'string') {
              params.status = status; 
              params.filter = `status eq "${status}"`;
          }
          if (sortConfig && typeof sortConfig === 'object' && sortConfig.key) {
              const direction = sortConfig.direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
              params.orderBy = `${sortConfig.key} ${direction}`;
          } else {
              params.orderBy = "id ASC";
          }

          const res = await apiClient.get(API_ENDPOINTS.ENROLLMENT.SUMARRIES, { params });
          return res.data;

      } catch (error) {
          console.error("Service: getSummaries failed", error);
          throw error;
      }
  },

// GET: Audit
  getEnrollmentAudit: async (id) => {
      try {
          const res = await apiClient.get(API_ENDPOINTS.ENROLLMENT.AUDIT(id));
          return res.data;
      } catch (error) {
          console.error("Fetch Audit Error:", error);
          throw error;
      }
  },

  // GET: get all element submission by using enrollment id
  getAllByEnrollment: async (enrollmentId) => {
    const response = await apiClient.get(API_ENDPOINTS.ENROLLMENT.HISTORY_BY_ENROLLMENT(enrollmentId));
    return response.data;
  }
};