/**
 * Helper function to append a file to FormData if it exists.
 * @param {*} formData The FormData object to append to.
 * @param {*} fieldName The field name for the file in the FormData.
 * @param {*} file The file object to append, which can be a standard File, an Expo WebDocumentPicker result, or an Expo ImagePicker result.
 */
export const appendFile = (formData, fieldName, file) => {
  if (!file) return;

  console.log("Appending file:");
  console.log(file);
  // Handle standard DOM File objects
  if (file instanceof File) {
    formData.append(fieldName, file, file.name);
    return;
  }

  // Handle Expo WebDocumentPicker result
  if (file.file instanceof File) {
    formData.append(fieldName, file.file, file.name);
    return;
  }

  // Handle Expo ImagePicker result (local URI)
  if (file.uri) {
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || file.type,
    });
    return;
  }
};
