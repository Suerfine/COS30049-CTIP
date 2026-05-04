import apiClient from "../config/apiConfig";
import { API_ENDPOINTS } from "../config/ApiEndpoints";

export const RegisterService={
    // GET: fetch all registration
    getAll: async (page = 1, size = 10, searchQuery = '', sortConfig, status="All") => {
        try {
            const q = searchQuery.trim();
            const params = { page, size };
            let filters = [];
            if (q) {
                filters.push(`(
                    firstname like "%${q}%"
                    or lastname like "%${q}%"
                    or identification like "%${q}%"
                    or personal_email like "%${q}%"
                    or tel like "%${q}%"
                )`);
            }

            if (status && status !== 'All') {
                filters.push(`status eq "${status.toLowerCase()}"`);
            }

            if (filters.length > 0) {
                params.filter = filters.join(' and ');
            }

            if (sortConfig?.key) {
                params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
            }

            const response = await apiClient.get(API_ENDPOINTS.USER.SIGNUP, { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch registration records');
        }
    },

    // POST: Create new registration
    registerUser: async(userData)=>{
        try{
            const formData=new FormData();

            formData.append('firstname', userData.fname);
            formData.append('lastname', userData.lname);
            formData.append('identification', userData.ic);
            formData.append('personal_email', userData.email);
            formData.append('tel', userData.telephone);

            if(userData.file){
                if (userData.file.file) {
                    formData.append('document', userData.file.file, userData.file.name);
                } else {
                    formData.append('document', {
                        uri:userData.file.uri,
                        name: userData.file.name,
                        type: userData.file.type || 'application/pdf',
                    });
                }
            }

            const response=await apiClient.post(API_ENDPOINTS.USER.SIGNUP, formData, {
                headers:{'Content-Type': 'multipart/form-data'}
            });
            return response.data;
        }catch(error){
            const message = error.response?.data?.message || 'Registration failed.';
            throw new Error(message);
        }
    },

    // POST: approve account
    approve:async (id)=>{
        try{
            const response=await apiClient.post(API_ENDPOINTS.ADMIN.APPROVE(id));
            return response.data;
        }catch(err){
            const message = err.response?.data?.message || "Check console for server error";
            console.error("Approve Error Status:", err.response?.status);
            throw new Error(message);
        }
    },

    // POST: reject account
    reject:async (id, message="Registration rejected by admin.")=>{
        try{
            const response=await apiClient.post(API_ENDPOINTS.ADMIN.REJECT(id), { message });
            return response.data;
        }catch(err){
            const errorMessage = err.response?.data?.message || "Check console for server error";
            console.error("Reject Error Status:", err.response?.status);
            throw new Error(errorMessage);
        }
    },

    // GET: open registration document
    openDocument:async (id, previewWindow=null)=>{
        try{
            const response=await apiClient.get(API_ENDPOINTS.USER.REGISTRATION_DOCUMENT(id), {
                responseType:'blob'
            });
            const blob = response.data instanceof Blob
                ? response.data
                : new Blob([response.data], { type:'application/pdf' });
            const contentDisposition = response.headers?.['content-disposition'] || '';
            const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
            const fileName = fileNameMatch?.[1] || 'Resume.pdf';
            const fileUrl=window.URL.createObjectURL(blob);

            const targetWindow = previewWindow && !previewWindow.closed
                ? previewWindow
                : window.open('', '_blank');

            if (targetWindow && !targetWindow.closed) {
                targetWindow.document.open();
                targetWindow.document.write(`
                    <!doctype html>
                    <html>
                        <head>
                            <title>${fileName}</title>
                            <style>
                                html, body {
                                    margin: 0;
                                    width: 100%;
                                    height: 100%;
                                    overflow: hidden;
                                    background:
                                        radial-gradient(circle at top left, rgba(10, 99, 64, 0.16), transparent 35%),
                                        linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
                                    font-family: Arial, sans-serif;
                                }
                                .viewer {
                                    display: flex;
                                    flex-direction: column;
                                    width: 100%;
                                    height: 100%;
                                }
                                .header {
                                    display: flex;
                                    align-items: center;
                                    justify-content: space-between;
                                    gap: 12px;
                                    padding: 14px 18px;
                                    background: rgba(255, 255, 255, 0.82);
                                    backdrop-filter: blur(10px);
                                    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                                    color: #0a6340;
                                    font-size: 14px;
                                    font-weight: 600;
                                }
                                .file-name {
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                }
                                iframe {
                                    border: 0;
                                    display: block;
                                    width: 100%;
                                    height: calc(100vh - 58px);
                                    background: transparent;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="viewer">
                                <div class="header">
                                    <span>Resume Preview</span>
                                    <span class="file-name">${fileName}</span>
                                </div>
                                <iframe src="${fileUrl}" title="${fileName}"></iframe>
                            </div>
                        </body>
                    </html>
                `);
                targetWindow.document.close();
            }

            setTimeout(()=>window.URL.revokeObjectURL(fileUrl), 60000);
        }catch(err){
            if (previewWindow && !previewWindow.closed) {
                previewWindow.close();
            }
            const message = err.response?.data?.message || "Failed to open registration document";
            throw new Error(message);
        }
    }

};
