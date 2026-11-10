export interface WeeklyScheduleDay { dayOfWeek:number; enabled:boolean; startTime:string; endTime:string; breakMinutes:number; }
const TIME=/^([01]\d|2[0-3]):[0-5]\d$/;
export function validateWeeklySchedule(days:WeeklyScheduleDay[]):string|null{
 if(days.length!==7)return "A weekly schedule must define all seven days.";
 for(let day=0;day<7;day++){const item=days.find(x=>x.dayOfWeek===day);if(!item)return "Every day of the week must be represented.";if(!TIME.test(item.startTime)||!TIME.test(item.endTime))return "Schedule times must use 24-hour HH:MM format.";if(!Number.isInteger(item.breakMinutes)||item.breakMinutes<0||item.breakMinutes>240)return "Break duration must be between 0 and 240 minutes.";if(item.enabled&&item.endTime<=item.startTime)return "End time must be later than start time.";}
 return null;
}
export function validateLeaveRange(start:Date,end:Date):string|null{
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))return "Leave dates must be valid.";
 if(end<start)return "Leave end date cannot be earlier than its start date.";
 return null;
}
export function normalizeEmployeeCode(value:string):string{return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g,"").slice(0,40);}
