import React from 'react';
import { useTeamStore } from '../context/TeamStoreContext';
import { TeamUserRole, TaskStatus, Priority } from '../types';
import { CheckCircle, Clock, AlertCircle, Briefcase, MapPin, Navigation, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const Dashboard = ({ setActivePage }: { setActivePage: (p: string) => void }) => {
  const { currentUser, tasks, projects, t } = useTeamStore();

  if (!currentUser) return null;

  // Filter tasks based on role
  const myTasks = currentUser?.role === TeamUserRole.ADMIN 
    ? tasks 
    : tasks.filter(task => task.assignedToIds.includes(currentUser?.id || ''));

  const stats = {
    todo: myTasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    done: myTasks.filter(t => t.status === TaskStatus.DONE).length,
    blocked: myTasks.filter(t => t.status === TaskStatus.BLOCKED).length,
  };

  const urgentTasks = myTasks.filter(t => t.priority === Priority.URGENT || t.priority === Priority.HIGH).filter(t => t.status !== TaskStatus.DONE);

  const data = [
    { name: t('todo'), value: stats.todo, color: '#94a3b8' },
    { name: t('inProgress'), value: stats.inProgress, color: '#3b82f6' },
    { name: t('done'), value: stats.done, color: '#22c55e' },
    { name: t('blocked'), value: stats.blocked, color: '#ef4444' },
  ];

  const StatCard = ({ title, count, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-1">{count}</h3>
      </div>
      <div className={`p-3 rounded-full ${bg}`}>
        <Icon className={color} size={24} />
      </div>
    </div>
  );

  const WorkerFocusCard = () => {
    // Find the most relevant task for the worker
    const activeTask = myTasks.find(t => t.status === TaskStatus.IN_PROGRESS) || myTasks.find(t => t.status === TaskStatus.TODO);
    
    if (!activeTask) return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-center py-12">
         <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
         <h3 className="text-xl font-bold text-slate-800">{t('noTasks')}</h3>
         <p className="text-slate-500">{t('done')}</p>
      </div>
    );

    const project = projects.find(p => p.id === activeTask.projectId);
    const googleMapsUrl = project ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${project.street} ${project.houseNumber}, ${project.city}`)}` : '#';

    return (
       <div className="bg-white rounded-xl shadow-lg border-l-4 border-primary-600 overflow-hidden">
          <div className="bg-slate-900 p-4 flex justify-between items-center">
             <h3 className="text-white font-bold flex items-center"><Clock className="mr-2 text-safety-500" /> {t('todayFocus')}</h3>
             <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${activeTask.priority === Priority.URGENT ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
               {t(activeTask.priority.toLowerCase() as any)}
             </span>
          </div>
          <div className="p-6">
             <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeTask.title}</h2>
             <p className="text-slate-600 mb-6">{activeTask.description}</p>
             
             {project && (
               <div className="bg-slate-50 p-4 rounded-lg mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{t('address')}</p>
                    <p className="font-semibold text-slate-800">{project.street} {project.houseNumber}</p>
                    <p className="text-sm text-slate-600">{project.postalCode} {project.city}</p>
                  </div>
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="bg-blue-100 text-blue-700 p-3 rounded-full hover:bg-blue-200 transition-colors">
                     <Navigation size={24} />
                  </a>
               </div>
             )}

             <div className="flex gap-3">
                <button onClick={() => setActivePage('projects')} className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors">
                  {t('projectDetails')}
                </button>
                <button className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors">
                  {t('logWork')}
                </button>
             </div>
          </div>
       </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('dashboard')}</h2>
          <p className="text-slate-500 text-sm">Welkom terug, {currentUser.name}</p>
        </div>
        {currentUser?.role === TeamUserRole.ADMIN && (
          <button 
            onClick={() => setActivePage('projects')}
            className="bg-safety-500 hover:bg-safety-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            + {t('addProject')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('todo')} count={stats.todo} icon={Briefcase} color="text-slate-600" bg="bg-slate-100" />
        <StatCard title={t('inProgress')} count={stats.inProgress} icon={Clock} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title={t('done')} count={stats.done} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatCard title={t('urgentTasks')} count={urgentTasks.length} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Focus Area */}
        <div className="lg:col-span-2 space-y-6">
           {currentUser?.role === TeamUserRole.WORKER && <WorkerFocusCard />}
           
           {currentUser?.role === TeamUserRole.ADMIN && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center"><AlertTriangle size={18} className="text-red-500 mr-2"/> {t('urgentTasks')}</h3>
               <div className="space-y-3">
                 {urgentTasks.length === 0 ? <p className="text-slate-400 italic">{t('noTasks')}</p> : urgentTasks.map(task => (
                   <div key={task.id} onClick={() => setActivePage('projects')} className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">{task.title}</h4>
                        <p className="text-xs text-red-600 flex items-center mt-1">
                           <Calendar size={12} className="mr-1" /> Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight size={18} className="text-red-400" />
                   </div>
                 ))}
               </div>
             </div>
           )}

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">{t('recentActivity')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                   <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-3">Task</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                   </thead>
                   <tbody>
                      {myTasks.slice(0, 5).map(task => (
                        <tr key={task.id} className="border-b hover:bg-slate-50">
                           <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                           <td className="px-4 py-3">
                              <div className="flex -space-x-2">
                                {task.assignedToIds.map(id => (
                                  <img key={id} className="w-6 h-6 rounded-full border-2 border-white" src={`https://picsum.photos/seed/${id}/50`} alt="User"/>
                                ))}
                              </div>
                           </td>
                           <td className="px-4 py-3">{new Date(task.dueDate).toLocaleDateString()}</td>
                           <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                task.status === TaskStatus.DONE ? 'bg-green-100 text-green-700' : 
                                task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {task.status}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Chart Column */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
            <h3 className="font-bold text-slate-800 mb-4">Task Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {data.map((d) => (
                 <div key={d.name} className="flex items-center text-xs text-slate-500">
                   <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: d.color }}></span>
                   {d.name}
                 </div>
              ))}
            </div>
           </div>

           {/* Quick Project Links */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-4">{t('projects')}</h3>
             <div className="space-y-3">
               {projects.map(p => {
                 const projectTasks = tasks.filter(t => t.projectId === p.id);
                 const doneTasks = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
                 const progress = projectTasks.length > 0 ? (doneTasks / projectTasks.length) * 100 : 0;
                 return (
                 <div key={p.id} onClick={() => setActivePage('projects')} className="cursor-pointer group">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-sm font-medium text-slate-700 group-hover:text-primary-600">{p.title}</span>
                     <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{p.postalCode}</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-safety-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                   </div>
                 </div>
               )})}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};