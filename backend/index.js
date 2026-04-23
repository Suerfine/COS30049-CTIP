const express=require('express');
const cors=require('cors');
const router=express.Router();
const multer=require('multer');
const fstat=require('fs');
const path=require('path');

//dot env for environment variables
const dotenv=require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uploadPath=path.join(__dirname, 'public', 'Courses');

// Create folder if it is not exists
if(!fstat.existsSync(uploadPath)){
    fstat.mkdirSync(uploadPath, {recursive: true});
}

app.use('/images', express.static(uploadPath));
app.use('/user-images', express.static(path.join(__dirname, 'public', 'Users')));

// Storage Configuration of the file
const storage=multer.diskStorage({
    destination: (req, file, call)=>{
        call(null, uploadPath);
    },
    filename:(req,file, call)=>{
        const uniqueShuffix=Date.now()+'-'+Math.round(Math.random() * 1E9);
        call(null,uniqueShuffix+path.extname(file.originalname));
    }
});

const upload=multer({storage: storage});

// ---------------------------------------------------------------------
// Dummy course data
const courses = [
    {
        id: 1,
        image: 'http://localhost:5000/images/first_aid.png',
        courseTitle: 'Basic First Aid',
        level: 'basic',
        duration: '15 hours 30 mins',
        expiryDate: '2027-05-08',
        description: 'Learn the fundamentals of first aid, including wound care, CPR basics, and emergency response.',
        modules: [
        {
            moduleId: 1,
            title: 'Introduction to First Aid',
            pages: [
            {
                pageId: 1.0,
                title: 'Introduction',
                sections: [
                { type: 'text', content: 'Welcome to Basic First Aid.' },
                { type: 'quiz', question: 'What is the emergency number?', options: ['911', '999'], answer: '999' }
                ]
            },
            {
                pageId: 1.1,
                title: 'Safety Guidelines',
                sections: [] 
            }
            ]
        },
        {
            moduleId: 2,
            title: 'Handling Cuts and Wounds',
            pages: [
            {
                pageId: 2.0,
                title: 'Introduction',
                sections: [
                { type: 'text', content: 'Clean the wound with antiseptic and cover with a bandage.' }
                ]
            },
            {
                pageId: 2.1,
                title: 'Minor Cuts',
                sections: [
                { type: 'text', content: 'Clean the wound with antiseptic and cover with a bandage.' }
                ]
            },
            {
                pageId: 2.2,
                title: 'Severe Bleeding',
                sections: [
                { type: 'text', content: 'Apply firm pressure and elevate the limb.' },
                { type: 'quiz', question: 'What should you do first for severe bleeding?', options: ['Apply pressure', 'Wash wound'], answer: 'Apply pressure' }
                ]
            }
            ]
        },
        {
            moduleId: 3,
            title: 'CPR Basics',
            pages: [
            {
                pageId: 3.0,
                title: 'Introduction',
                sections: [
                { type: 'text', content: 'Perform 30 compressions followed by 2 breaths.' }
                ]
            },
            {
                pageId: 3.1,
                title: 'Adult CPR',
                sections: [
                { type: 'text', content: 'Perform 30 compressions followed by 2 breaths.' }
                ]
            },
            {
                pageId: 3.2,
                title: 'Child CPR',
                sections: [
                { type: 'text', content: 'Use one hand for compressions and adjust depth.' }
                ]
            }
            ]
        },
        {
            moduleId: 4,
            title: 'Fracture Management',
            pages: [
            {
                pageId: 4.0,
                title: 'Introduction',
                sections: [
                { type: 'text', content: 'Look for swelling, deformity, and pain.' }
                ]
            },
            {
                pageId: 4.1,
                title: 'Identifying Fractures',
                sections: [
                { type: 'text', content: 'Look for swelling, deformity, and pain.' }
                ]
            },
            {
                pageId: 4.2,
                title: 'Immobilization Techniques',
                sections: [
                { type: 'text', content: 'Use splints to immobilize the injured area.' }
                ]
            }
            ]
        }
        ]
    },
    {
        id: 2,
        image: 'http://localhost:5000/images/cpr.png',
        courseTitle: 'CPR Training',
        level: 'basic',
        duration: '8 hours',
        expiryDate: '2026-06-30',
        description: 'Focused training on CPR techniques for adults, children, and infants.',
        modules: [
        {
            moduleId: 1,
            title: 'Introduction to First Aid',
            pages: [
            {
                pageId: 1.0,
                title: 'Introduction',
                sections: [
                { type: 'text', content: 'Welcome to Basic First Aid.' },
                { type: 'quiz', question: 'What is the emergency number?', options: ['911', '999'], answer: '999' }
                ]
            },
            {
                pageId: 2.1,
                title: 'Safety Guidelines',
                sections: [] 
            }
            ]
        }
        ]
    },
    {
        id: 3,
        image: 'http://localhost:5000/images/plantconservation.jpg',
        courseTitle: 'Plant Conservation',
        level: 'advanced',
        duration: '10 hours',
        expiryDate: '2026-08-30',
        description: 'Gain insights and practical knowlegdge on how to properly conserve plants',
        modules: [
        {
            moduleId: 1,
            title: 'Plant Conservation Law in Malaysia',
            pages: [
            {
                pageId: 1.0,
                title: 'Introduction',
                sections: [
                { type: 'text', content: 'Welcome to Plant Conservation Law.' },
                { type: 'quiz', question: 'What is the Conservation Law of Section 92?', options: ['aaaa', 'bbbb'], answer: 'aaaa' }
                ]
            },
            {
                pageId: 2.1,
                title: 'Conservation Restraints',
                sections: [] 
            }
            ]
        }
        ]
    }
];

// Route to get all courses
app.get('/api/courses', (req,res)=>{
    res.json(courses);
});

// Route to get a single courses by ID
app.get('/api/courses/:id', (req,res)=>{
    const course=courses.find(c=>c.id===parseInt(req.params.id));

    if(!course){
        return res.status(404).json({message: 'Course not found.'});
    }
    res.json(course);
});

// Route to get a single course's modules
app.get('/api/course/:id/modules',(req,res)=>{
    const course=courses.find(c=>c.id===parseInt(req.params.id));
    if(!course){
        return res.status(404).json({message:'Course not found.'});
    }
    res.json(course.modules);
})

// Route to add a new course
app.post('/api/courses', upload.single('image'), (req, res)=>{
    try{
        if(!req.file){
            return res.status(400).send({message: 'No file uploaded'});
        }
        const newId=courses.length>0 ? Math.max(...courses.map(c=>c.id))+1 : 1;
        const imageUrl=`http://localhost:5000/images/${req.file.filename}`;
        const newCourse={
            id: newId,
            courseTitle:req.body.courseTitle,
            duration:req.body.duration,
            expiryDate:req.body.expiryDate,
            image:imageUrl,
            description: req.body.description,
            modules:[]
        };
        courses.push(newCourse);

        res.status(201).json({
            message:"Course created",
            course: newCourse
        });
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

// Route to update the existing course
app.put('/api/courses/:id', upload.single('image'), (req,res)=>{
    const {id}=req.params;
    const courseIndex=courses.findIndex(c=> c.id===parseInt(id));

    if(courseIndex===-1){
        return res.status(404).json({message: "Course not found"});
    }

    let imageUrl=courses[courseIndex].image;
    if(req.file){
        imageUrl=`http://localhost:5000/images/${req.file.filename}`;
    }
    const updatedCourse={
        ...courses[courseIndex],
        courseTitle: req.body.courseTitle || courses[courseIndex].courseTitle,
        duration:req.body.duration || courses[courseIndex].duration,
        expiryDate:req.body.expiryDate || courses[courseIndex].expiryDate,
        description: req.body.description || courses[courseIndex].description,
        image:imageUrl
    };

    courses[courseIndex]=updatedCourse;

    res.json({
        message:'Course updated successfully.',
        course:updatedCourse
    });
});

// Route to delete the course
app.delete('/api/courses/:id', (req,res)=>{
    const {id}=req.params;
    const courseId=parseInt(id);
    const courseIndex=courses.findIndex(c=>c.id === courseId);
    if(courseIndex===-1){
        return res.status(404).json({message: "Course not found"});
    }

    const fs=require('fs');
    const path=require("path");
    const fileName=courses[courseIndex].image.split('/').pop();
    fs.unlinkSync(path.join(__dirname, 'public/courses', fileName));

    courses.splice(courseIndex,1);

    res.json({message: "Course deleted successfully", deletedId:courseId});
});

// Route to add a new module to a course
app.post('/api/courses/:id/modules', (req,res)=>{
    const course=courses.find(c=> c.id ===parseInt(req.params.id));

    if(!course){
        return res.status(404).json({message:'Course not found'});
    }

    const {moduleId, title, pages}= req.body;

    const newModule={moduleId, title, pages: pages || []};
    course.modules.push(newModule);

    res.json(course);
});

// Route to edit module
app.put('/api/courses/:id/modules/:moduleId', (req,res)=>{
    const courseId=parseInt(req.params.id);
    const moduleId=parseInt(req.params.moduleId);
    const course=courses.find(c=>c.id===courseId);
    if(!course){
        return res.status(404).json({message:'Course not found'});
    }

    const module=course.modules.find(m=>m.moduleId===moduleId);
    if(!module){
        return res.status(404).json({message:'Module not found'});
    }
    const {title}=req.body;
    if(title && title.trim()!==""){
        module.title=title.trim();
    }
    res.json(module);
})

// Route to edit page
app.put('/api/courses/:id/modules/:moduleId/pages/:pageId', (req,res)=>{
    const courseId=parseInt(req.params.id);
    const moduleId=parseInt(req.params.moduleId);
    const pageId=req.params.pageId;
    const {title}=req.body;

    const course=courses.find(c=>c.id===courseId);
    if(!course){
        return res.status(404).json({message:'Course not found'});
    }
    const module=course.modules.find(m=>m.moduleId===moduleId);
    if(!module){
        return res.status(404).json({message:'Module not found'});
    }
    const page=module.pages.find(p=>String(p.pageId)===String(pageId));
    if(!page){
        return res.status(404).json({message:'Page not found'});
    }
    if(title && title.trim()){
        page.title=title.trim();
        res.json(page);
    }else{
        res.status(404).json({message:'Title is required.'});
    }
})

// Route to add Page
app.post('/api/courses/:id/modules/:moduleId/pages', (req,res)=>{
    const courseId=parseInt(req.params.id);
    const moduleId=parseInt(req.params.moduleId);
    const course=courses.find(c=>c.id===courseId);
    if(!course){
        return res.status(404).json({message:'Course not found'});
    }
    const module=course.modules.find(m=>m.moduleId===moduleId);
    if(!module){
        return res.status(404).json({message:'Module not found'});
    }

    const {pageId, title}= req.body;

    const newPage={pageId:pageId, title:title && title.trim() !== "" ? title :title.trim()};

    module.pages.push(newPage);

    res.json(newPage);
})

// Route to delete a module
app.delete('/api/courses/:id/modules/:moduleId',(req,res)=>{
    const courseId=parseInt(req.params.id);
    const moduleId=parseInt(req.params.moduleId);
    const course=courses.find(c=>c.id===courseId);
    if(!course){
        return res.status(404).json({message:'Course not found'});
    }
    const module=course.modules.find(m=>m.moduleId===moduleId);
    if(!module){
        return res.status(404).json({message:'Module not found'});
    }
    course.modules=course.modules.filter(m=>m.moduleId !== moduleId);
    res.json({message: 'Module deleted successfully', deletedModule: module})
})

// Route to delete a page
app.delete('/api/courses/:id/modules/:moduleId/pages/:pageId', (req, res) => {
    const courseId = parseInt(req.params.id);
    const moduleId = parseInt(req.params.moduleId);
    const pageId = req.params.pageId; 
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        return res.status(404).json({ message: 'Course not found' });
    }
    const module = course.modules.find(m => m.moduleId === moduleId);
    if (!module) {
        return res.status(404).json({ message: 'Module not found' });
    }
    const pageExists = module.pages.find(p => String(p.pageId) === String(pageId));
    if (!pageExists) {
        return res.status(404).json({ message: 'Page not found' });
    }
    module.pages = module.pages.filter(p => String(p.pageId) !== String(pageId));
    res.json({ 
        message: 'Page deleted successfully', 
        deletedPageId: pageId,
        updatedPages: module.pages 
    });
});
// ---------------------------------------------------------------------

// Dummy user data
const users=[
    {
        id: 1, 
        fname: 'John',
        lname: 'Doe',
        username: 'johndoe_dev',
        ic: '020512-13-4233',
        email: 'johndoe@gmail.com',
        telefon: '012-3456789',
        registerDate: '2025-10-15',
        status: 'Approved',
        profileImage: 'http://localhost:5000/user-images/johndoe.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 2,
        fname: 'Jenny',
        lname: 'Sim',
        username: 'jenny_dev',
        ic: '0802-13-4433',
        email: 'jenny@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-01-20',
        status: 'Pending',
        profileImage: 'http://localhost:5000/user-images/jenny.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 3,
        fname: 'John',
        lname: 'Smith',
        username: 'john_smith',
        ic: '9102-11-2233',
        email: 'johnsmith@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-02-10',
        status: 'Rejected',
        profileImage: 'http://localhost:5000/user-images/smith.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 4,
        fname: 'Olivia',
        lname: 'Bennett',
        username: 'olivia_b',
        ic: '9903-22-3344',
        email: 'olivia.bennett@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-01-25',
        status: 'Approved',
        profileImage: 'http://localhost:5000/user-images/olivia.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 5,
        fname: 'Daniel',
        lname: 'Warren',
        username: 'daniel_w',
        ic: '8704-33-4455',
        email: 'daniel.warren@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-03-01',
        status: 'Pending',
        profileImage: 'http://localhost:5000/user-images/daniel.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 6,
        fname: 'Chloe',
        lname: 'Hayes',
        username: 'chloe_h',
        ic: '9505-44-5566',
        email: 'chloe.hayes@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-02-15',
        status: 'Approved',
        profileImage: 'http://localhost:5000/user-images/chloe.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 7,
        fname: 'Marcus',
        lname: 'Reed',
        username: 'marcus_r',
        ic: '8906-55-6677',
        email: 'marcus.reed@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-01-30',
        status: 'Rejected',
        profileImage: 'http://localhost:5000/user-images/marcus.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 8,
        fname: 'Isabelle',
        lname: 'Clark',
        username: 'isabelle_c',
        ic: '970766-13-7788',
        email: 'isabelle.clark@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-03-05',
        status: 'Approved',
        profileImage: 'http://localhost:5000/user-images/issabelle.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 9,
        fname: 'Lucas',
        lname: 'Mitchell',
        username: 'lucas_m',
        ic: '8608-77-8899',
        email: 'lucas.mitchell@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-02-20',
        status: 'Pending',
        profileImage: 'http://localhost:5000/user-images/lucas.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 10,
        fname: 'Mark',
        lname: 'Willburg',
        username: 'mark_w',
        ic: '9409-88-9900',
        email: 'mark.willburg@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-03-10',
        status: 'Approved',
        profileImage: 'http://localhost:5000/user-images/mark.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 11,
        fname: 'Nicholas',
        lname: 'Agenn',
        username: 'nicholas_a',
        ic: '9810-99-0011',
        email: 'nicholas.agenn@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-01-28',
        status: 'Rejected',
        profileImage: 'http://localhost:5000/user-images/nicholas.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 12,
        fname: 'Mia',
        lname: 'Nadinn',
        username: 'mia_n',
        ic: '9211-00-1122',
        email: 'mia.nadinn@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-03-15',
        status: 'Approved',
        profileImage: 'http://localhost:5000/user-images/mia.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    },
    {
        id: 13,
        fname: 'Noemi',
        lname: 'Villan',
        username: 'noemi_v',
        ic: '9312-11-2233',
        email: 'noemi.villan@gmail.com',
        telefon: '012-3456789',
        registerDate: '2026-02-05',
        status: 'Pending',
        profileImage: 'http://localhost:5000/user-images/noemi.png',
        remark: 'I would like to register for access to the dashboard and manage my projects.'
    }
]

// Route to get all users
app.get('/api/users',(req,res)=>{
    res.json(users);
})

// Accounts (1,4,6,8,10,12)
const accounts=[
    {
        id: 1,
        reg_id:1,
        joinedDate: '2025-10-15',
        lastLogin: '5 minutes ago',
    },
    {
        id: 2,
        reg_id:4,
        joinedDate: '2024-10-5',
        lastLogin: '2 minutes ago',
    },
    {
        id: 3,
        reg_id:6,
        joinedDate: '2024-04-12',
        lastLogin: '5 days ago',
    },
    {
        id: 4,
        reg_id:8,
        joinedDate: '2023-06-04',
        lastLogin: '3 minutes ago',
    },
    {
        id: 5,
        reg_id:10,
        joinedDate: '2024-10-07',
        lastLogin: '10 days ago',
    },
    {
        id: 6,
        reg_id:12,
        joinedDate: '2025-10-15',
        lastLogin: '5 minutes ago',
    }
]   

// Route to get all accounts
app.get('/api/accounts',(req,res)=>{
    res.json(accounts);
})

// ---------------------------------------------------------------------

// Dummy todo data
const todos = [
  { id: 1, title: "Finish Module 1", course: "Basic First Aid", date: "2026-04-30", completed: true },
  { id: 2, title: "Finish Module 1", course: "CPR Training", date: "2026-05-06", completed: true },
  { id: 3, title: "Finish Module 2", course: "Basic First Aid", date: "2026-08-05", completed: false },
  { id: 4, title: "Finish Module 2", course: "CPR Training", date: "2026-05-30", completed: false },
  { id: 5, title: "Finish Module 2", course: "CPR Training", date: "2026-05-30", completed: false },
  { id: 6, title: "Finish Module 2", course: "CPR Training", date: "2026-06-01", completed: false }
];

// Route to get all todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// ---------------------------------------------------------------------

// hardcode usertype
const userType = 'user'; // or 'admin'

// Route to get user type
app.get('/api/userType', (req, res) => {
  res.json(userType);
});

// Correction: Later progress can add inside course api
const progress = [
  { courseId: 1, progress: 1 },
  { courseId: 2, progress: 0.4 },
  { courseId: 3, progress: 0 },
];

// Route to get all progress
app.get('/api/progress', (req, res) => {
  res.json(progress);
});

// ---------------------------------------------------------------------

// Start Over
app.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})


