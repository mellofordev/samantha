export const visual_response_description = `
A string containing UI generation instructions in XML format. Format:
    <ui_component>
    <topic>Topic name</topic>
    <concept>Specific concept</concept>
    <level>Educational level</level>
    <elements>
        <element>Visual element 1</element>
        <element>Visual element 2</element>
    </elements>
    <objectives>
        <objective>Learning objective 1</objective>
        <objective>Learning objective 2</objective>
    </objectives>
    </ui_component>

    Example:
    <ui_component>
    <topic>Physics</topic>
    <concept>Newton's Laws</concept>
    <level>high-school</level>
    <elements>
        <element>force-diagram</element>
        <element>interactive-simulation</element>
    </elements>
    <objectives>
        <objective>understand action-reaction pairs</objective>
        <objective>visualize force relationships</objective>
    </objectives>
    </ui_component>
`;
