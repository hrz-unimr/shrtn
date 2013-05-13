CREATE TABLE shrtn (
    hash character varying NOT NULL,
    url character varying NOT NULL,
    clicks bigint NOT NULL,
    ctime bigint NOT NULL,
    atime bigint NOT NULL
);
CREATE UNIQUE INDEX hash ON shrtn USING btree (hash);
CREATE INDEX url ON shrtn USING btree (url);
