import {useMemo, useState} from 'react';
import { Avatar } from 'react-native-paper';

export const useSearchFilter=(data, searchTerm, status, searchFields)=>{
    const [sortConfig,setSortConfig]=useState({key:null, direction:'asc'});
    const requestSort = (key) => {
        let direction = 'asc';
        
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                direction = 'desc';
            }
        }
        setSortConfig({ key, direction });
    };
    const filteredData= useMemo(()=>{
        if(!data) return [];
        // Filter Logic
        let result= data.filter((item)=>{
            const matchesSearch=searchFields.some((field)=>{
                let valueToSearch="";
                if (field==='fullName'){
                    valueToSearch=`${item.firstname || ''} ${item.lastname || ''}`;
                }else{
                    valueToSearch=item[field] || "";
                }
                return valueToSearch?.toString().toLowerCase().includes(searchTerm.toLowerCase());
            });

            const matchesStatus =
                status === 'All' ||
                (item.status && item.status.toLowerCase().trim() === status.toLowerCase().trim());
            return matchesSearch && matchesStatus;
        });

        // Sorting Logic
        if(sortConfig && sortConfig.key){
            result=[...result].sort((a,b)=>{
                let aValue=sortConfig.key==='fullName' ? `${a.firstname} ${a.lastname}` : a[sortConfig.key];
                let bValue=sortConfig.key==='fullName' ? `${b.firstname} ${b.lastname}` : b[sortConfig.key];

                aValue=aValue || "";
                bValue=bValue || "";

                if(sortConfig.key==="created_at" || sortConfig.key==='joinedDate' || sortConfig.key==='lastLogin'){
                    return sortConfig.direction==='asc' ? new Date(aValue)-new Date(bValue) : new Date(bValue)-new Date(aValue);
                }

                if(sortConfig.key==="personal_email"){
                    result.sort((a,b)=>{
                        const emailA=a.personal_email?.toLowerCase() || "";
                        const emailB=b.personal_email?.toLowerCase() || "";

                        return sortConfig.direction === "asc" ? emailA.localeCompare(emailB) :
                        emailB.localeCompare(emailB);
                    });
                }

                const comparison=aValue.toString().localeCompare(bValue.toString());
                return sortConfig.direction==='asc' ? comparison :-comparison;
            });
        }
        return result;
    }, [data,searchTerm, status, searchFields]);
    return { filteredData, requestSort, sortConfig, setSortConfig };
};