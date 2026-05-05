export const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    let formatted = date.toLocaleDateString('en-MY');

    if (includeTime) {
        const time = date.toLocaleTimeString('en-MY', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        formatted += ', ' + time;
    }

    return formatted.replace('am', 'AM').replace('pm', 'PM');
}
