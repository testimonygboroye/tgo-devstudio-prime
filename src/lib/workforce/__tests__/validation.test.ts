import { normalizeEmployeeCode, validateLeaveRange, validateWeeklySchedule } from "../validation";
describe("workforce validation",()=>{
 const week=Array.from({length:7},(_,dayOfWeek)=>({dayOfWeek,enabled:dayOfWeek>0&&dayOfWeek<6,startTime:"09:00",endTime:"17:00",breakMinutes:60}));
 test("accepts a complete weekly schedule",()=>expect(validateWeeklySchedule(week)).toBeNull());
 test("rejects missing days and invalid shift windows",()=>{expect(validateWeeklySchedule(week.slice(0,6))).toMatch(/seven days/);expect(validateWeeklySchedule(week.map((x,i)=>i===1?{...x,endTime:"08:00"}:x))).toMatch(/later/);});
 test("validates leave ranges",()=>{expect(validateLeaveRange(new Date("2026-11-10"),new Date("2026-11-12"))).toBeNull();expect(validateLeaveRange(new Date("2026-11-12"),new Date("2026-11-10"))).toMatch(/earlier/);});
 test("normalizes employee codes",()=>expect(normalizeEmployeeCode(" tgo / 2026 # 001 ")).toBe("TGO2026001"));
});
