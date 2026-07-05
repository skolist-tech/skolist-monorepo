import aws_cdk as core
import aws_cdk.assertions as assertions

from aws_cdk_infra.aws_cdk_infra_stack import AwsCdkInfraStack

# example tests. To run these tests, uncomment this file along with the example
# resource in aws_cdk_infra/aws_cdk_infra_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = AwsCdkInfraStack(app, "aws-cdk-infra")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
