const testAuth = (z, bundle) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  // In this example, we'll hit httpbin, which validates the Authorization Header against the arguments passed in the URL path
  const promise = z.request({
    method: 'GET',
    url: 'https://{{bundle.authData.bpmonlineurl}}/0/rest/UsrCustomConfigurationService/Hello'
  });

  // This method can return any truthy value to indicate the credentials are valid.
  // Raise an error to show
  return promise.then((response) => {
    if (response.status === 401) {
      throw new Error('The Session Info you supplied is invalid');
    }
    return response;
  });
};

const getBPMSCRFToken = (cookiesArray) => {
  if (Array.isArray(cookiesArray) === false) {
    return null;
  };

  let token = cookiesArray.find((element) => {
    return element.includes("BPMCSRF");
  })
    .split('; ').find((element) => {
      return element.includes("BPMCSRF");
    })
    .split("=")[1];

  return token;
};

const getAuthCookies = (z, bundle) => {

  const promise = z.request({
    method: 'POST',
    url: 'https://{{bundle.authData.bpmonlineurl}}/ServiceModel/AuthService.svc/Login',
    body: {
      UserName: bundle.authData.username,
      UserPassword: bundle.authData.password,
    }
  });

  return promise.then((response) => {
    if (response.status === 401) {
      throw new Error('The username/password you supplied is invalid');
    }

    const json = JSON.parse(response.content);
    if (json.Code != 0) {
      throw new Error(json.Message);
    }
    // todo: get bpmcsrf here
    const cookies = response.headers._headers['set-cookie'];
    const token = getBPMSCRFToken(cookies);
    return {
      cookies: cookies,
      BPMCSRF: token
    };
  });
};


const getAllCookies = (z, bundle) => {
  //console.log('Calling getAuthCookies in getAllCookies');
  return getAuthCookies(z, bundle).then((authCookies) => {
    //console.log('Calling Hello service in getAllCookies to get session');
    const promise = z.request({
      method: 'GET',
      url: 'https://{{bundle.authData.bpmonlineurl}}/0/rest/UsrCustomConfigurationService/Hello',
      headers: {
        "cookie": authCookies.cookies,
        "BPMCSRF": authCookies.BPMCSRF,
      }
    });

    return promise.then((response) => {
      if (response.status === 401) {
        throw new Error('The username/password you supplied is invalid');
      }

      let json = JSON.parse(response.content);
      if (json.HelloResult !== 'Hello') {
        throw new Error('Error Hello result');
      }

      const cookies = [...response.headers._headers['set-cookie'], ...authCookies.cookies];

      bundle.authData.cookies = cookies;
      bundle.authData.BPMCSRF = authCookies.BPMCSRF;
      return {
        cookies: cookies,
        BPMCSRF: authCookies.BPMCSRF
      };
    });
  });


};

module.exports = {
  type: 'session',
  // Define any auth fields your app requires here. The user will be prompted to enter this info when
  // they connect their account.
  fields: [
    //todo: add app url here
    { key: 'username', label: 'Username', required: true, type: 'string' },
    { key: 'password', label: 'Password', required: true, type: 'password' },
    { key: 'bpmonlineurl', label: "Bpm'online URL", required: true, type: 'string' }
  ],
  // The test method allows Zapier to verify that the credentials a user provides are valid. We'll execute this
  // method whenver a user connects their account for the first time.
  test: testAuth,
  // The method that will exchange the fields provided by the user for session credentials.
  sessionConfig: {
    perform: getAllCookies
  },
  // assuming "username" is a key returned from the test
  connectionLabel: '{{username}}'
};
