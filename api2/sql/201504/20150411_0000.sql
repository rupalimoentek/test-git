-- linking table between provisioned_routes and call_flow_recording
CREATE TABLE provisioned_route_location_link (
    provisioned_route_id        INT NOT NULL REFERENCES provisioned_route(provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
    location_id                 INT NOT NULL REFERENCES location(location_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (provisioned_route_id, location_id)
);
CREATE INDEX provisioned_route_location_link_provisioned_route_id_idx ON provisioned_route_location_link (provisioned_route_id);
CREATE INDEX provisioned_route_location_link_location_id_idx ON provisioned_route_location_link (location_id);