import {useState, useEffect} from 'react';
import { userProfileService } from "../services/userProfileService";
import { Alert } from "react-native";
import { useUserDashboard } from './useUserDashboard';

export const useUserProfile=()=>{
    const {user} = useUserDashboard();
    // Personal Information state
    const [form, setForm] = useState({
        firstname: '',
        lastname: '',
        identification: '',
        personal_email: '',
        tel: '',
    });

    const updateField = (key, value) => {
    setForm(prev => ({
        ...prev,
        [key]: value
    }));
};
    const [isEditing, setIsEditing]=useState(false);

    // Account Security state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
 
    // Edit mode toggles
    const [editingUsername, setEditingUsername] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);

    // Modal visibility
    const [pfpModalVisible, setPfpModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    // Dummy image path
    const [newImagePath, setNewImagePath] = useState('');

    // Password visibility
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');

    const [loading, setLoading]=useState(false);

    // save updated info
    const handleSave = async () => {
        setLoading(true);

        try {
            const result = await userProfileService.update(user.id, form);

            if (result.success) {
                Alert.alert("Success", "Profile updated successfully.");
                setIsEditing(false);
            } else {
                Alert.alert("Error", result.serverError);
            }

            return result;
        } finally {
            setLoading(false);
        }
    };

    // select image for ChangePfpContent modal
    const pickImage = async () => {
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Permission to access gallery is required!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setNewImagePath(result.assets[0].uri);
        }
    };

    // Populate fields
    useEffect(() => {
        if (user) {
            setForm({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                identification: user.identification || '',
                personal_email: user.personal_email || '',
                tel: user.tel || '',
            });
            setUsername(user.username || '');
        }
    }, [user]);

    return{
        user,
        form, setForm,
        updateField,
        username,setUsername,
        password,setPassword,
        editingUsername, setEditingUsername,
        editingPassword, setEditingPassword,
        pfpModalVisible, setPfpModalVisible,
        passwordModalVisible, setPasswordModalVisible,
        newImagePath, setNewImagePath,
        showCurrentPassword, setShowCurrentPassword,
        showNewPassword, setShowNewPassword,
        currentPassword, setCurrentPassword,
        pickImage,
        isEditing, setIsEditing,
        handleSave,
    };
};
