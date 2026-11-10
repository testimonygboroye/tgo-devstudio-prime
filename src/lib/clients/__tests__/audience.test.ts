import {getUserAudienceFilter} from "../audience";

describe("separate staff and client account identities",()=>{
  it("resolves the client identity when the same email also belongs to staff",()=>{
    expect(getUserAudienceFilter("Founder@TGO.example","client")).toEqual({email:"founder@tgo.example",accountType:"client"});
  });
  it("resolves the staff identity independently for the same email",()=>{
    expect(getUserAudienceFilter("Founder@TGO.example","staff")).toEqual({email:"founder@tgo.example",accountType:{$ne:"client"}});
  });
});
