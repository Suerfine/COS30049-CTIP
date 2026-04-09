const express=require('express');
const cors=require('cors');

const app=express();
app.use(cors());
app.use('/images', express.static('public'));
app.use(express.json());

// ---------------------------------------------------------------------
// Dummy course data
const courses = [
    {
        id: 1,
        image: 'http://localhost:5000/images/first_aid.png',
        courseTitle: 'Basic First Aid',
        numModules: 15,
        duration: '15 hours 30 mins',
        expiryDate: '05-08-2027',
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
        numModules: 10,
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
app.put('api/courses/:id/modules/:moduleId/pages/:pageId', (req,res)=>{
    const courseId=parseInt(req.params.id);
    const moduleId=parseInt(req.params.moduleId);
    const pageId=parseInt(req.params.pageId);
    const {title}=req.body;

    const course=courses.find(c=>c.id===courseId);
    if(!course){
        return res.status(404).json({message:'Course not found'});
    }
    const module=course.modules.find(m=>m.id===moduleId);
    if(!module){
        return res.status(404).json({message:'Module not found'});
    }
    const page=module.pages.find(p=>p.pageId===pageId);
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
const PORT =5000;
app.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})


