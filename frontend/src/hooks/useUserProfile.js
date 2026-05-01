import {useState, useEffect} from 'react';

// Import other hooks and components
import { useUserDashboard } from './useUserDashboard';

export const useUserProfile=()=>{
    const {user} = useUserDashboard();
    // Personal Information state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [icPassport, setIcPassport] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [resume, setResume] = useState('');
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
            setFirstName(user.firstname || '');
            setLastName(user.lastname || '');
            setIcPassport(user.identification || '');
            setEmail(user.personal_email || '');
            setPhone(user.telefon || '');
            setResume(user.resume || '');
            setUsername(user.username || '');
        }
    }, [user]);

    return{
        user,
        firstName, setFirstName,
        lastName,setLastName,
        icPassport, setIcPassport,
        email, setEmail,
        phone,setPhone,
        resume, setResume,
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
    };
};
