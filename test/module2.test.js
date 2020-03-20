const chai = require('chai');
const expect = require('chai').expect;
chai.use(require('chai-http'));
chai.use(require('chai-string'));

const host = "https://" + process.env.PS_S3_BUCKET_NAME + ".s3.amazonaws.com";
const webhost = process.env.PS_S3_WEBHOST_URL;
const accountID = process.env.PS_AWS_ACCOUNT_ID;

describe('Deploy a static site on Amazon S3', () => {

  it('should be a valid AWS account id @verify-aws-account', () => {
    expect(accountID, 'Account ID should be a string').to.be.a('string');
    expect(accountID.length, 'Account ID should be exactly 12 characters long').to.be.equal(12);
    expect(/^\d+$/.test(accountID), 'Account ID should contain only numbers').to.be.true;
  });

  it('should be accessible @verify-uploaded-files', async () => {
    expect(process.env.PS_S3_BUCKET_NAME, 'Bucket name must be entered by the user').to.be.a('string');
    expect(process.env.PS_S3_BUCKET_NAME, 'Bucket name should not contain and periods').to.not.include('.');
    expect(process.env.PS_S3_BUCKET_NAME.length, 'Bucket name must be entered by the user').to.be.gt(3);

    const res = await chai.request(host).get('/index.html');
    expect(res, 'Permissions should be set to make file available to the public').to.have.status(200);
    expect(res, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res, 'File should be an HTML file, verify the correct file was uploaded').to.be.html;
    expect(res.text, 'File should contain the correct content, make sure the correct file was uploaded').to.have.string('ps-index');

    const res2 = await chai.request(host).get('/test.txt');
    expect(res2, 'Permissions should be set to make file available to the public').to.have.status(200);
    expect(res2, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res2, 'File should be an HTML file, verify the correct file was uploaded').to.be.text;
    expect(res2.text, 'File should contain the correct content, make sure the correct file was uploaded').to.have.string('ps-ccp-02');
  });

  it('error page should appear if navigating to page that does not exist @verify-static-hosting', async () => {
    expect(process.env.PS_S3_WEBHOST_URL, 'Static website hosting URL must be entered by the user').to.be.a('string');
    expect(process.env.PS_S3_WEBHOST_URL, 'Enter in the full URL from the static website hosting configuration').to.startWith('http');

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
    expect(process.env.PS_S3_WEBHOST_URL, 'Static website hosting URL must be entered by the user').to.be.a('string');
    expect(process.env.PS_S3_WEBHOST_URL, 'Enter in the full URL from the static website hosting configuration').to.startWith('http');

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
