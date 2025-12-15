

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Project, Task, ChatMessage, UserRole, TaskStatus, Priority, TaskTemplate } from '../types';
import { translations, Language } from '../translations';

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  tasks: Task[];
  taskTemplates: TaskTemplate[];
  chatMessages: ChatMessage[];
  language: Language;
  login: (userId: string) => void;
  logout: () => void;
  setLanguage: (lang: Language) => void;
  toggleAvailability: () => void;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  addChatMessage: (text: string) => void;
  // User Management
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  // Templates
  addTaskTemplate: (template: TaskTemplate) => void;
  updateTaskTemplate: (template: TaskTemplate) => void;
  deleteTaskTemplate: (id: string) => void;
  t: (key: keyof typeof translations.pl) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Mock Data
const MOCK_USERS: User[] = [
  { id: '1', name: 'Jan Kowalski', role: UserRole.ADMIN, isAvailable: true, completedTasksCount: 15, phone: '+31 6 12345678', email: 'jan@betoncoat.nl', avatar: 'https://picsum.photos/100/100?random=1', specialization: 'Project Manager' },
  { id: '2', name: 'Piotr Nowak', role: UserRole.WORKER, isAvailable: true, completedTasksCount: 8, phone: '+31 6 87654321', email: 'piotr@betoncoat.nl', avatar: 'https://picsum.photos/100/100?random=2', specialization: 'Schilder (Maler)', hourlyRate: 35 },
  { id: '3', name: 'Adam Wisniewski', role: UserRole.WORKER, isAvailable: false, completedTasksCount: 12, phone: '+48 500 123 123', email: 'adam@betoncoat.nl', avatar: 'https://picsum.photos/100/100?random=3', specialization: 'Stucadoor', hourlyRate: 40 },
  { id: '4', name: 'Willem de Vries', role: UserRole.WORKER, isAvailable: true, completedTasksCount: 5, phone: '+31 6 11223344', email: 'willem@betoncoat.nl', avatar: 'https://picsum.photos/100/100?random=4', specialization: 'Timmerman', hourlyRate: 38 },
];

const MOCK_PROJECTS: Project[] = [
  { 
    id: 'p1', 
    title: 'Renowacja Kamienicy Centrum', 
    clientName: 'Gemeente Amsterdam',
    street: 'Damrak',
    houseNumber: '12',
    postalCode: '1012 LG',
    city: 'Amsterdam',
    description: 'General renovation of facade and interior.', 
    startDate: '2023-11-01', 
    endDate: '2023-12-15',
    status: 'ACTIVE', 
    tasks: ['t1', 't2'] 
  },
  { 
    id: 'p2', 
    title: 'Budowa Domu Jednorodzinnego', 
    clientName: 'Mevr. Jansen',
    street: 'Kerkstraat',
    houseNumber: '5',
    postalCode: '3581 RD',
    city: 'Utrecht',
    description: 'New build foundation to roof.', 
    startDate: '2023-11-20', 
    endDate: '2024-03-01',
    status: 'ACTIVE', 
    tasks: [] 
  },
];

const MOCK_TASKS: Task[] = [
  { 
    id: 't1', projectId: 'p1', title: 'Malowanie Elewacji', description: 'Malowanie ściany frontowej na biało. Uważać na okna.', 
    assignedToIds: ['2', '3'], status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, dueDate: '2023-12-01', estimatedHours: 40,
    toolsRequired: ['Rusztowanie', 'Pistolet natryskowy'],
    materialsRequired: [{ id: 'm1', name: 'Farba Biała', quantity: 50, unit: 'L' }],
    materialsUsed: [], comments: [], photos: [], workLogs: [] 
  },
  { 
    id: 't2', projectId: 'p1', title: 'Wymiana Rur', description: 'Wymiana pionów kanalizacyjnych na parterze.', 
    assignedToIds: ['4'], status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDate: '2023-12-05', estimatedHours: 8,
    toolsRequired: ['Wiertarka', 'Piła do rur'],
    materialsRequired: [{ id: 'm2', name: 'Rura PVC 110', quantity: 10, unit: 'szt' }],
    materialsUsed: [], comments: [], photos: [], workLogs: [] 
  },
];

const MOCK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'temp1',
    name: 'Standard Painting (Interior)',
    title: 'Paint Room Walls',
    description: 'Prepare walls, tape edges, apply primer, apply 2 coats of paint.',
    priority: Priority.MEDIUM,
    estimatedHours: 8,
    toolsRequired: ['Brushes', 'Rollers', 'Tape', 'Ladder'],
    materialsRequired: [{ id: 'tm1', name: 'Latex Paint', quantity: 10, unit: 'L' }, { id: 'tm2', name: 'Primer', quantity: 5, unit: 'L' }]
  },
  {
    id: 'temp2',
    name: 'Install Drywall',
    title: 'Install Drywall Panels',
    description: 'Measure, cut, and screw drywall panels to studs. Tape and mud joints.',
    priority: Priority.MEDIUM,
    estimatedHours: 16,
    toolsRequired: ['Drill', 'Drywall Knife', 'T-Square', 'Sander'],
    materialsRequired: [{ id: 'tm3', name: 'Drywall Sheets', quantity: 20, unit: 'pcs' }, { id: 'tm4', name: 'Joint Compound', quantity: 1, unit: 'bucket' }]
  }
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(MOCK_TEMPLATES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'c1', userId: '1', userName: 'Jan Kowalski', text: 'Witamy w nowym systemie! / Welkom!', timestamp: Date.now() - 100000 }
  ]);
  const [language, setLanguage] = useState<Language>('pl');

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const toggleAvailability = () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, isAvailable: !currentUser.isAvailable };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  // --- CRUD ---
  const addProject = (project: Project) => setProjects([...projects, project]);
  
  const addTask = (task: Task) => setTasks([...tasks, task]);
  
  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    // Update user stats if completed
    if (updatedTask.status === TaskStatus.DONE) {
       const newUsers = users.map(u => {
         if (updatedTask.assignedToIds.includes(u.id)) {
           return { ...u, completedTasksCount: u.completedTasksCount + 1 };
         }
         return u;
       });
       setUsers(newUsers);
    }
  };

  const addUser = (user: User) => setUsers([...users, user]);
  
  const updateUser = (user: User) => {
    setUsers(users.map(u => u.id === user.id ? user : u));
    if (currentUser?.id === user.id) setCurrentUser(user);
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const addTaskTemplate = (template: TaskTemplate) => {
    setTaskTemplates([...taskTemplates, template]);
  };

  const updateTaskTemplate = (template: TaskTemplate) => {
    setTaskTemplates(taskTemplates.map(t => t.id === template.id ? template : t));
  };

  const deleteTaskTemplate = (id: string) => {
    setTaskTemplates(taskTemplates.filter(t => t.id !== id));
  };

  const addChatMessage = (text: string) => {
    if (!currentUser) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: Date.now()
    };
    setChatMessages([...chatMessages, msg]);
  };

  const t = (key: keyof typeof translations.pl) => {
    return translations[language][key] || key;
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, projects, tasks, taskTemplates, chatMessages, language,
      login, logout, setLanguage, toggleAvailability,
      addProject, addTask, updateTask, addChatMessage,
      addUser, updateUser, deleteUser,
      addTaskTemplate, updateTaskTemplate, deleteTaskTemplate,
      t
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
