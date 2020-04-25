const chai = require('chai');
const expect = require('chai').expect;
chai.use(require('chai-http'));
chai.use(require('chai-string'));

const removeTrailingSlashIfPresent = (input) => {
  if(!input) {
    return input;
  }
  let output = input;
  var lastChar = input.substr(-1);
  if (lastChar === '/') {
    output = output.slice(0, str.length - 1);
  }
  return output;
}

const getHostURL = () => {
  if(!process.env.PS_S3_BUCKET_NAME || process.env.PS_S3_BUCKET_NAME.length < 5) {
    return '';
  }
  return 'https://' + process.env.PS_S3_BUCKET_NAME.trim() + '.s3.amazonaws.com';
};

const trimOptionalEnvironmentVariable = (val) => {
  return (val && val.length > 2) ? val.trim() : val;
};

const getWebhostURL = () => {
  if(!process.env.PS_S3_WEBHOST_URL || process.env.PS_S3_WEBHOST_URL.length < 5) {
    return 'http://www.google.com/';
  }
  return removeTrailingSlashIfPresent('http://' + process.env.PS_S3_WEBHOST_URL.trim() + '.s3-website-us-east-1.amazonaws.com');
}

const bucketName = trimOptionalEnvironmentVariable(process.env.PS_S3_BUCKET_NAME);
const host = getHostURL();
const webhost = getWebhostURL();
const accountID = trimOptionalEnvironmentVariable(process.env.PS_AWS_ACCOUNT_ID);

describe('Deploy a static site on Amazon S3', () => {

  it('should be a valid AWS account id @verify-aws-account', () => {
    expect(accountID, 'Account ID should be a string').to.be.a('string');
    expect(accountID.length, 'Account ID should be exactly 12 characters long').to.be.equal(12);
    expect(/^\d+$/.test(accountID), 'Account ID should contain only numbers').to.be.true;
  });

  it('should have a valid bucket name @verify-s3-bucket', () => {
    expect(bucketName, 'Bucket name must be entered by the user').to.be.a('string');
    expect(bucketName, 'Bucket name should not contain and periods').to.not.include('.');
    expect(bucketName.length, 'Bucket name must be entered by the user').to.be.gt(3);
  });

  it('should be accessible @verify-uploaded-files', async () => {
    expect(bucketName, 'Bucket name must be entered by the user').to.be.a('string');
    expect(bucketName, 'Bucket name should not contain and periods').to.not.include('.');
    expect(bucketName.length, 'Bucket name must be entered by the user').to.be.gt(3);

    const res = await chai.request(host).get('/index.html');
    expect(res, 'Permissions should be set to make index.html available to the public').to.have.status(200);
    expect(res, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res, 'File should be an HTML file, verify the correct file was uploaded').to.be.html;
    expect(res.text, 'File should contain the correct content, make sure the correct file was uploaded').to.have.string('ps-index');

    const res2 = await chai.request(host).get('/test.txt');
    expect(res2, 'Permissions should be set to make test.txt available to the public').to.have.status(200);
    expect(res2, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res2, 'File should be an HTML file, verify the correct file was uploaded').to.be.text;
    expect(res2.text, 'File should contain the correct content, make sure the correct file was uploaded').to.have.string('ps-ccp-02');
    
  });

  it('error page should appear if navigating to page that does not exist @verify-static-hosting', async () => {
    expect(0, 'Test verified with the new one').to.be.a('string');
    expect(webhost, 'Static website hosting URL must be entered by the user').to.be.a('string');
    expect(webhost, 'Enter in the full URL from the static website hosting configuration').to.startWith('http');

    const res = await chai.request(webhost).get('/file-that-doesnt-exist');
    expect(res, 'Make sure you did not upload any additional files into the bucket').to.have.status(404);
    expect(res, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res, 'Make sure the proper error file was set to error.html in the static website hosting settings').to.be.html;
    expect(res.text, 'Make sure the proper error file was set to error.html in the static website hosting settings').to.have.string('ps-ccp-03');

    const res2 = await chai.request(webhost).get('/');
    expect(res2, 'Permissions should be set to make index.html file available and static website hosting settings have index.html as index file').to.have.status(200);
    expect(res2, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res2, 'File should be an HTML file, verify the correct file was uploaded').to.be.html;
    expect(res2.text, 'File should contain the correct content, make sure the correct file was uploaded').to.have.string('ps-index');
  });

  it('web application should be deployed in the user bucket @verify-web-application', async () => {
    expect(webhost, 'Static website hosting URL must be entered by the user').to.be.a('string');
    expect(webhost, 'Enter in the full URL from the static website hosting configuration').to.startWith('http');

    const res = await chai.request(webhost).get('/verify.txt');
    expect(res, 'Make sure you added the bucket policy to make all files publicly readable').to.have.status(200);
    expect(res, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res, 'Make sure the proper error file was set to error.html in the static website hosting settings').to.be.text;
    expect(res.text, 'Make sure the proper error file was set to error.html in the static website hosting settings').to.have.string('ps-ccp-03');

    const res2 = await chai.request(webhost).get('/');
    expect(res2, 'Make sure you added the bucket policy to make all files publicly readable and that you uploaded all files in group2').to.have.status(200);
    expect(res2, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res2, 'File should be an HTML file, verify the correct file was uploaded').to.be.html;
    expect(res2.text, 'File should contain the correct key, make sure the correct file was uploaded').to.have.string('ps-index');
  });

});
