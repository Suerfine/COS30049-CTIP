export const formatDate=(dateString)=>{
    if(!dateString) return 'N/A';
    const date=new Date(dateString);
    if(isNaN(date.getTime())) return 'N/A';
    let formatted=
        date.toLocaleDateString('en-MY')+', '+date.toLocaleTimeString('en-MY', {hour: '2-digit', minute: '2-digit'});
    return formatted.replace('am', 'AM').replace('pm', 'PM');
}