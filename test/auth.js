const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('..');
const appTester = zapier.createAppTester(App);

const getToken = (cookiesArray, name) => {
  if (Array.isArray(cookiesArray) === false) {
    return null;
  };
  
  let token = cookiesArray.find((element) => {
    return element.includes(name);
  })
    .split('; ').find((element) => {
      return element.includes(name);
    })
    .split("=")[1];

  return token;
};

describe("bpm'online auth app", () => {
  zapier.tools.env.inject();
  const bundle = {
    authData: {
      username: process.env.TEST_USERNAME,
      password: process.env.TEST_PASSWORD,
      bpmonlineurl:process.env.TEST_URL
    }
  };

it('has all cookies and tokens for username/password', (done) => {
    // Try changing the values of username or password to see how the test method behaves
   

    appTester(App.authentication.sessionConfig.perform, bundle)
      .then((newAuthData) => {
        should(newAuthData.cookies).be.instanceOf(Array);
        // BPMLOADER added twice!!!!
        should(newAuthData.cookies.length).eql(6);

        const BPMSESSIONID = getToken(newAuthData.cookies,'BPMSESSIONID');
        should(BPMSESSIONID).be.instanceof(String);
        should(BPMSESSIONID).be.not.empty;

        // it's added twice!!!!
        const BPMLOADER = getToken(newAuthData.cookies,'BPMLOADER');
        should(BPMLOADER).be.instanceof(String);
        should(BPMLOADER).be.not.empty;

        const ASPXAUTH = getToken(newAuthData.cookies,'.ASPXAUTH');
        should(ASPXAUTH).be.instanceof(String);
        should(ASPXAUTH).be.not.empty;

        const BPMCSRF = getToken(newAuthData.cookies,'BPMCSRF');
        should(BPMCSRF).be.instanceof(String);
        should(BPMCSRF).be.not.empty;
        should(BPMCSRF).be.eql(newAuthData.BPMCSRF);

        const UserName = getToken(newAuthData.cookies,'UserName');
        should(UserName).be.instanceof(String);
        should(UserName).be.not.empty;

        
        done();
      })
      .catch(done);
  });


  it('has auth cookies and bpmcsrf added to every request', (done) => {

    appTester(App.authentication.test, bundle)
      .then((response) => {
        response.status.should.eql(200);
        //console.log(response.request.headers);
        const cookie = response.request.headers['cookie'];
        should(cookie).be.instanceOf(Array);
        // BPMLOADER added twice!!!!
        should(cookie.length).eql(6);
        const BPMCSRF = response.request.headers['BPMCSRF'];
        should(BPMCSRF).be.eql(bundle.authData.BPMCSRF);
        done();
      })
      .catch(done);
  });


});
