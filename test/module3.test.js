const chai = require('chai');
const expect = require('chai').expect;
chai.use(require('chai-http'));
chai.use(require('chai-string'));

const host = "https://" + process.env.PS_S3_CF_BUCKET_NAME + ".s3.amazonaws.com";
const cfhost = "https://" + process.env.PS_CF_DOMAIN_NAME;

describe('Deploy a static site to Amazon CloudFront', () => {

  it('should be a proper bucket name @verify-s3-cf-bucket-name', async () => {
    expect(process.env.PS_S3_CF_BUCKET_NAME, 'Bucket name must be entered by the user').to.be.a('string');
    expect(process.env.PS_S3_CF_BUCKET_NAME.length, 'Bucket name must be entered by the user').to.be.gt(3);
  });

  it('make sure the index file is not publicly available @verify-no-public-files', async () => {
    const res = await chai.request(host).get('/index.html');
    expect(res, 'Make sure you did not make index.html publicly readable or configure static website hosting').to.have.status(403);
    expect(res, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
  });

  it('should be a proper bucket name @verify-cf-domain-name', async () => {
    expect(process.env.PS_S3_CF_BUCKET_NAME, 'CloudFront domain name must be entered by the user').to.be.a('string');
    expect(process.env.PS_S3_CF_BUCKET_NAME.length, 'CloudFront domain name must be entered by the user').to.be.gt(3);
    expect(process.env.PS_CF_DOMAIN_NAME, 'Enter the generated CloudFront domain name which should end with cloudfront.net').to.endWith('.cloudfront.net');
  });

  it('make sure the CloudFront content is available @verify-cloudfront-deployment', async () => {
    const res = await chai.request(cfhost).get('/');
    expect(res, 'Make sure you uploaded all of the correct files into the S3 bucket and configured distribution properly').to.have.status(200);
    expect(res.text, 'File should contain the correct key, make sure the correct file was uploaded').to.have.string('ps-index-2');
    expect(res, 'File should be served from Amazon S3').to.have.header('server', 'AmazonS3');
    expect(res, 'File should be proxied by Amazon CloudFront').to.have.header('via', /\(CloudFront\)$/);
    expect(res, 'File should be proxied by Amazon CloudFront').to.have.header('X-Amz-Cf-Id');
    expect(res, 'File should be proxied by Amazon CloudFront').to.have.header('X-Amz-Cf-Pop');
    expect(res, 'File should be proxied by Amazon CloudFront').to.have.header('X-Cache');
  });

});
