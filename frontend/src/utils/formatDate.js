export const formatDate=(dateString)=>{
    if(!dateString) return '';
    const date=new Date(dateString);
    let formatted=
        date.toLocaleDateString('en-MY')+', '+date.toLocaleTimeString('en-MY', {hour: '2-digit', minute: '2-digit'});
    return formatted.replace('am', 'AM').replace('pm', 'PM');
}