import { validateClientRegistration } from "../validation";
describe("validateClientRegistration",()=>{
 it("normalizes structured names and email",()=>{
  expect(validateClientRegistration({firstName:" Ada ",middleName:" Augusta ",lastName:" Lovelace ",email:" ADA@example.com ",password:"StrongPassword123",confirmPassword:"StrongPassword123"})).toEqual({ok:true,value:{firstName:"Ada",middleName:"Augusta",lastName:"Lovelace",name:"Ada Augusta Lovelace",email:"ada@example.com",password:"StrongPassword123"}});
 });
 it("allows an optional middle name",()=>{
  const result=validateClientRegistration({firstName:"Ada",middleName:" ",lastName:"Lovelace",email:"ada@example.com",password:"StrongPassword123",confirmPassword:"StrongPassword123"});
  expect(result.ok&&result.value.name).toBe("Ada Lovelace");
 });
 it("rejects mismatched confirmation passwords",()=>{
  expect(validateClientRegistration({firstName:"Ada",lastName:"Lovelace",email:"ada@example.com",password:"StrongPassword123",confirmPassword:"DifferentPassword123"})).toEqual({ok:false,error:"The passwords do not match. Enter the same password in both fields."});
 });
 it("rejects weak passwords",()=>{expect(validateClientRegistration({firstName:"Ada",lastName:"Lovelace",email:"ada@example.com",password:"weak",confirmPassword:"weak"}).ok).toBe(false);});
 it("rejects malformed email addresses",()=>{expect(validateClientRegistration({firstName:"Ada",lastName:"Lovelace",email:"not-an-email",password:"StrongPassword123",confirmPassword:"StrongPassword123"})).toEqual({ok:false,error:"Enter a valid email address."});});
 it("rejects missing or overlong first and last names",()=>{
  expect(validateClientRegistration({firstName:"A",lastName:"Lovelace",email:"ada@example.com",password:"StrongPassword123",confirmPassword:"StrongPassword123"}).ok).toBe(false);
  expect(validateClientRegistration({firstName:"x".repeat(61),lastName:"Lovelace",email:"ada@example.com",password:"StrongPassword123",confirmPassword:"StrongPassword123"}).ok).toBe(false);
 });
});
