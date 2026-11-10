import {getPublicSiteUrl} from "../site-url";

describe("canonical public site URL",()=>{
  const original={nodeEnv:process.env.NODE_ENV,siteUrl:process.env.SITE_URL,renderUrl:process.env.RENDER_EXTERNAL_URL,nextPublic:process.env.NEXT_PUBLIC_SITE_URL,url:process.env.URL,vercel:process.env.VERCEL_URL};
  afterEach(()=>{
    if(original.nodeEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=original.nodeEnv;
    if(original.siteUrl===undefined)delete process.env.SITE_URL;else process.env.SITE_URL=original.siteUrl;
    if(original.renderUrl===undefined)delete process.env.RENDER_EXTERNAL_URL;else process.env.RENDER_EXTERNAL_URL=original.renderUrl;
    if(original.nextPublic===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=original.nextPublic;
    if(original.url===undefined)delete process.env.URL;else process.env.URL=original.url;
    if(original.vercel===undefined)delete process.env.VERCEL_URL;else process.env.VERCEL_URL=original.vercel;
  });
  it("prefers the configured public HTTPS domain over localhost",()=>{
    process.env.NODE_ENV="production";process.env.SITE_URL="http://localhost:3000";process.env.RENDER_EXTERNAL_URL="https://tgo-devstudio-prime.onrender.com";
    expect(getPublicSiteUrl()).toBe("https://tgo-devstudio-prime.onrender.com");
  });
  it("uses the stable public production host rather than localhost when no host setting exists",()=>{
    process.env.NODE_ENV="production";delete process.env.SITE_URL;delete process.env.RENDER_EXTERNAL_URL;delete process.env.NEXT_PUBLIC_SITE_URL;delete process.env.URL;delete process.env.VERCEL_URL;
    expect(getPublicSiteUrl()).toBe("https://tgo-devstudio-prime.onrender.com");
  });
});
