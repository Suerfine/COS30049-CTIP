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
        fullName: 'John Doe',
        username: 'johndoe_dev',
        ic: '020512-13-4233',
        email: 'johndoe@gmail.com',
        status: 'Active',
        role:'parkguide',
        joinedDate: '2025-10-15',
        lastActive: '2 mins ago',
        profileImage: 'http://localhost:5000/user-images/johndoe.png',
    },
    {
        id: 2,
        fullName: 'Jenny Sim',
        username: 'jenny_dev',
        ic: '0802-13-4433',
        email: 'jenny@gmail.com',
        status: 'Inactive',
        role:'admin',
        joinedDate: '2026-01-20',
        lastActive: '5 days ago',
        profileImage: 'http://localhost:5000/user-images/jenny.png',
    },
    {
        id: 3,
        fullName: 'John Smith',
        username: 'john_smith',
        ic: '9102-11-2233',
        email: 'johnsmith@gmail.com',
        status: 'Active',
        role:'parkguide',
        joinedDate: '2026-02-10',
        lastActive: '2 days ago',
        profileImage: 'http://localhost:5000/user-images/smith.png',
    },
    {
        id: 4,
        fullName: 'Olivia Bennett',
        username: 'olivia_b',
        ic: '9903-22-3344',
        email: 'olivia.bennett@gmail.com',
        status: 'Inactive',
        role:'admin',
        joinedDate: '2026-01-25',
        lastActive: '10 days ago',
        profileImage: 'http://localhost:5000/user-images/olivia.png',
    },
    {
        id: 5,
        fullName: 'Daniel Warren',
        username: 'daniel_w',
        ic: '8704-33-4455',
        email: 'daniel.warren@gmail.com',
        status: 'Active',
        role:'parkguide',
        joinedDate: '2026-03-01',
        lastActive: '1 day ago',
        profileImage: 'http://localhost:5000/user-images/daniel.png',
    },
    {
        id: 6,
        fullName: 'Chloe Hayes',
        username: 'chloe_h',
        ic: '9505-44-5566',
        email: 'chloe.hayes@gmail.com',
        status: 'Active',
        role:'admin',
        joinedDate: '2026-02-15',
        lastActive: '3 hours ago',
        profileImage: 'http://localhost:5000/user-images/chloe.png',
    },
    {
        id: 7,
        fullName: 'Marcus Reed',
        username: 'marcus_r',
        ic: '8906-55-6677',
        email: 'marcus.reed@gmail.com',
        status: 'Inactive',
        role:'parkguide',
        joinedDate: '2026-01-30',
        lastActive: '15 days ago',
        profileImage: 'http://localhost:5000/user-images/marcus.png',
    },
    {
        id: 8,
        fullName: 'Isabelle Clark',
        username: 'isabelle_c',
        ic: '9707-66-7788',
        email: 'isabelle.clark@gmail.com',
        status: 'Active',
        role:'admin',
        joinedDate: '2026-03-05',
        lastActive: '5 hours ago',
        profileImage: 'http://localhost:5000/user-images/issabelle.png',
    },
    {
        id: 9,
        fullName: 'Lucas Mitchell',
        username: 'lucas_m',
        ic: '8608-77-8899',
        email: 'lucas.mitchell@gmail.com',
        status: 'Inactive',
        role:'parkguide',
        joinedDate: '2026-02-20',
        lastActive: '20 days ago',
        profileImage: 'http://localhost:5000/user-images/lucas.png',
    },
    {
        id: 10,
        fullName: 'Mark Willburg',
        username: 'mark_w',
        ic: '9409-88-9900',
        email: 'mark.willburg@gmail.com',
        status: 'Active',
        role:'admin',
        joinedDate: '2026-03-10',
        lastActive: '12 hours ago',
        profileImage: 'http://localhost:5000/user-images/mark.png',
    },
    {
        id: 11,
        fullName: 'Nicholas Agenn',
        username: 'nicholas_a',
        ic: '9810-99-0011',
        email: 'nicholas.agenn@gmail.com',
        status: 'Inactive',
        role:'parkguide',
        joinedDate: '2026-01-28',
        lastActive: '30 days ago',
        profileImage: 'http://localhost:5000/user-images/nicholas.png',
    },
    {
        id: 12,
        fullName: 'Mia Nadinn',
        username: 'mia_n',
        ic: '9211-00-1122',
        email: 'mia.nadinn@gmail.com',
        status: 'Active',
        role:'admin',
        joinedDate: '2026-03-15',
        lastActive: '6 hours ago',
        profileImage: 'http://localhost:5000/user-images/mia.png',
    },
    {
        id: 13,
        fullName: 'Noemi Villan',
        username: 'noemi_v',
        ic: '9312-11-2233',
        email: 'noemi.villan@gmail.com',
        status: 'Inactive',
        role:'parkguide',
        joinedDate: '2026-02-05',
        lastActive: '25 days ago',
        profileImage: 'http://localhost:5000/user-images/noemi.png',
    }
]

// Route to get all users
app.get('/api/users',(req,res)=>{
    res.json(users);
})

// ---------------------------------------------------------------------

// Dummy todo data
const todos = [
  { id: 1, title: "Finish Module 1", course: "Basic First Aid", date: "2026-06-30", completed: false },
  { id: 2, title: "Finish Module 1", course: "CPR Training", date: "2027-06-30", completed: true },
  { id: 3, title: "Finish Module 2", course: "Basic First Aid", date: "2026-08-05", completed: false },
  { id: 4, title: "Finish Module 2", course: "CPR Training", date: "2027-08-06", completed: false },
  { id: 5, title: "Finish Module 2", course: "CPR Training", date: "2027-08-06", completed: false },
  { id: 6, title: "Finish Module 2", course: "CPR Training", date: "2027-08-06", completed: false }
];

// Route to get all todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// ---------------------------------------------------------------------


// Dummy user progress data
const userType = 'user'; // or 'admin'

app.get('/api/userType', (req, res) => {
  res.json(userType);
});

// Correction: Later progress can add inside course api
const progress = [
  { id: 1, course: 'Basic First Aid', progress: 0.7 },
  { id: 2, course: 'CPR Training', progress: 0.4 },
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


