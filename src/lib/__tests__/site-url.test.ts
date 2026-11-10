const mutableEnv=process.env as Record<string,string|undefined>;
import {getPublicSiteUrl} from "../site-url";

describe("canonical public site URL",()=>{
  const original={nodeEnv:mutableEnv.NODE_ENV,siteUrl:mutableEnv.SITE_URL,renderUrl:mutableEnv.RENDER_EXTERNAL_URL,nextPublic:mutableEnv.NEXT_PUBLIC_SITE_URL,url:mutableEnv.URL,vercel:mutableEnv.VERCEL_URL,vercelProduction:mutableEnv.VERCEL_PROJECT_PRODUCTION_URL};
  afterEach(()=>{
    if(original.nodeEnv===undefined)delete mutableEnv.NODE_ENV;else mutableEnv.NODE_ENV=original.nodeEnv;
    if(original.siteUrl===undefined)delete mutableEnv.SITE_URL;else mutableEnv.SITE_URL=original.siteUrl;
    if(original.renderUrl===undefined)delete mutableEnv.RENDER_EXTERNAL_URL;else mutableEnv.RENDER_EXTERNAL_URL=original.renderUrl;
    if(original.nextPublic===undefined)delete mutableEnv.NEXT_PUBLIC_SITE_URL;else mutableEnv.NEXT_PUBLIC_SITE_URL=original.nextPublic;
    if(original.url===undefined)delete mutableEnv.URL;else mutableEnv.URL=original.url;
    if(original.vercel===undefined)delete mutableEnv.VERCEL_URL;else mutableEnv.VERCEL_URL=original.vercel;
    if(original.vercelProduction===undefined)delete mutableEnv.VERCEL_PROJECT_PRODUCTION_URL;else mutableEnv.VERCEL_PROJECT_PRODUCTION_URL=original.vercelProduction;
  });
  it("prefers the configured public HTTPS domain over localhost",()=>{
    mutableEnv.NODE_ENV="production";delete mutableEnv.VERCEL_PROJECT_PRODUCTION_URL;mutableEnv.SITE_URL="http://localhost:3000";mutableEnv.RENDER_EXTERNAL_URL="https://tgo-devstudio-prime.onrender.com";
    expect(getPublicSiteUrl()).toBe("https://tgo-devstudio-prime.onrender.com");
  });
  it("uses the stable public production host rather than localhost when no host setting exists",()=>{
    mutableEnv.NODE_ENV="production";delete mutableEnv.SITE_URL;delete mutableEnv.RENDER_EXTERNAL_URL;delete mutableEnv.NEXT_PUBLIC_SITE_URL;delete mutableEnv.URL;delete mutableEnv.VERCEL_URL;delete mutableEnv.VERCEL_PROJECT_PRODUCTION_URL;
    expect(getPublicSiteUrl()).toBe("https://tgo-devstudio-prime.vercel.app");
  });
});
