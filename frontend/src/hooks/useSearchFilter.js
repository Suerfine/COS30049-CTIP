import {useMemo} from 'react';

export const useSearchFilter=(data, searchTerm, status, searchFields)=>{
    const filteredData= useMemo(()=>{
        if(!data) return [];
        return data.filter((item)=>{
            const matchesSearch=searchFields.some((field)=>{
                let valueToSearch="";
                if (field==='fullName'){
                    valueToSearch=`${item.firstname || ''} ${item.lastname || ''}`;
                }else{
                    valueToSearch=item[field] || "";
                }
                return valueToSearch?.toString().toLowerCase().includes(searchTerm.toLowerCase());
            });

            const matchesStatus=status==='All' || item.status?.toLowerCase()===status.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [data,searchTerm, status, searchFields]);
    return filteredData;
};