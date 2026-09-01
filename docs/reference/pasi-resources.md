# PASI official reference index

> [FVSD Nexus](../../README.md) / [Documentation](../README.md) / PASI official references

**Reviewed:** September 1, 2026

This page indexes publicly available Alberta Education PASI material relevant to evaluating an FVSD-owned connector. The official onboarding contact, supported contract version, environments, permissions, and current operational requirements must be confirmed with Alberta Education before implementation.

## Primary portals

- [PASI development portal](https://extranet.education.alberta.ca/pasidevnet/)
- [PASI documentation root](https://extranet.education.alberta.ca/pasidevnet/Docs/)
- [Technical API table of contents](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/Index.html)
- [PASI WSDL library](https://extranet.education.alberta.ca/pasidevnet/PASI.WSDL/)
- [Reference Client downloads](https://extranet.education.alberta.ca/pasidevnet/Reference%20Client/)

## Technical concepts

- [Getting Started](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/GettingStarted.html) - documentation structure and versioned web-service overview.
- [Authentication and Authorization](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/Authentication.html) - registered client certificates, caller information, represented organization, student association, and authorization concepts.
- [Updating PASI Core Data](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/DataUpdateApproach.html) - optimistic concurrency and `PASICoreVersion` expectations.
- [Data Synchronization](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/ApproachToDataSynchronization.html) - `IsDataAvailable`, long polling, entity retrieval, status retrieval, and synchronization versions.
- [Error Reporting](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/ErrorReporting.html) - service faults, exception categories, Core Alerts, warnings, advice, and acknowledgements.
- [PASI Reference Clients](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/PASIReferenceClients.html) - .NET examples for connectivity, retrieval, updates, enrolment, and synchronization.
- [PASI Validation Rules](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/ValidationDefinitions.html) - technical entry point to the business validation catalogue.
- [State Province ID Management](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/StateProvinceIdManagement.html) - ASN deactivation, linking, and primary/secondary identifier implications.
- [Identify Student Technical Details](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/IdentifyStudent.html) - search inputs, match quality, and linked-identifier behaviour.
- [PASI Code Values](https://extranet.education.alberta.ca/pasidevnet/Docs/Technical%20API/PASI%20Techincal%20Concepts%20Overview/CodeValues.html) - published code sets and effective-school-year information.

## Contracts and examples

- [Published WSDL versions](https://extranet.education.alberta.ca/pasidevnet/PASI.WSDL/) - historical/versioned contract packages. The public listing reviewed on September 1, 2026 exposed packages through `9.28.37.5`; that observation is not a statement that this is the contract Alberta Education will authorize for FVSD.
- [2024 APOP WSDL in the 9.28.37.5 package](https://extranet.education.alberta.ca/pasidevnet/PASI.WSDL/9.28.37.5/2024/APOPService2024.wsdl) - a concrete published WSDL illustrating service, port, operation, and endpoint metadata.
- [Reference Client source](https://extranet.education.alberta.ca/pasidevnet/Reference%20Client/ReferenceClients-src.zip) - Alberta Education's downloadable VB.NET reference solution.

## Business and data standards

- [PASI business documentation](https://extranet.education.alberta.ca/pasidevnet/Docs/Business/) - authoritative business rules should be reviewed alongside generated technical documentation.
- [PASI data standards](https://extranet.education.alberta.ca/pasidevnet/Docs/Data%20Standards/) - published standards for course, marks, student identity, address, phone, personal information, and school enrolment data.
- [Code types](https://extranet.education.alberta.ca/pasidevnet/Docs/CodeTypes/) - published PASI code-type material.
- [Integration documents](https://extranet.education.alberta.ca/pasidevnet/Docs/Integration%20Documents/) - additional Alberta Education integration specifications.

## Usage cautions

- The public portal contains generated documentation and historical versions. Confirm the supported client contract and onboarding instructions directly with Alberta Education.
- Do not commit downloaded certificates, configuration containing credentials, production payloads, or reference-client secrets.
- Business documentation and validation rules must be treated as authoritative companions to generated service contracts.
- A successful reference-client example proves connectivity, not production readiness, supportability, or authorization for a specific FVSD workflow.
