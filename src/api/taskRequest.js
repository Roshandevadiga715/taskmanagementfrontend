import axios from "axios";

const API_BASE_URL = "http://localhost:5000";
export const createTask = async (data) => {
  // data should include taskType and optionally taskDataId
  const response = await axios.post(
    `${API_BASE_URL}/api/tasks/create-task`,
    data,
    {
      withCredentials: true,
    }
  );
  return response.data;
};


export const updateTask = async (id, data) => {
  const hasFile = data.attachments?.some((item) => item instanceof File);

  if (hasFile) {
    const formData = new FormData();

    // Append attachments
    data.attachments.forEach((file) => {
      if (file instanceof File) {
        formData.append("attachments", file);
      }
    });

    // Append other fields
    for (const [key, value] of Object.entries(data)) {
      if (key !== "attachments") {
        if (typeof value === "object" && value !== null) {
          formData.append(key, JSON.stringify(value)); // for arrays like tags
        } else {
          formData.append(key, value);
        }
      }
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/tasks/update-task/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    return response.data;
  } else {
    // Normal JSON update
    const response = await axios.put(
      `${API_BASE_URL}/api/tasks/update-task/${id}`,
      data,
      {
        withCredentials: true,
      }
    );
    return response.data;
  }
};

export const getAllTasks = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/tasks/all-task-data`, {
    withCredentials: true,
  });
  return response.data;
};

export const getTaskById = async (id, taskType = "task") => {
  // Always pass taskType as query param for backend
  const response = await axios.get(
    `${API_BASE_URL}/api/tasks/individual-task-data/${id}?taskType=${taskType}`,
    { withCredentials: true }
  );
  return response.data;
};
