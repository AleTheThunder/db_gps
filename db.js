-- 1. Tabellen erstellen

CREATE TABLE Container (
    container_id INT PRIMARY KEY,
    container_name VARCHAR(50) NOT NULL
);

CREATE TABLE GPS_Data (
    container_id INT,
    latitude FLOAT,
    longitude FLOAT,
    FOREIGN KEY (container_id) REFERENCES Container(container_id)
);

-- 2. Beispiel-Container und -Daten einfügen

INSERT INTO Container (container_id, container_name)
VALUES
    (1, 'CONTAINER_1'),
    (2, 'CONTAINER_2'),
    (3, 'CONTAINER_3'),
    (4, 'CONTAINER_NAME_STILL'),
    (5, 'CONTAINER_NAME_ANDERER_RICHTUNG');

INSERT INTO GPS_Data (container_id, latitude, longitude)
VALUES
    (1, 50.0, 10.0),
    (2, 51.0, 11.0),
    (3, 52.0, 12.0),
    (4, 53.0, 13.0),
    (5, 54.0, 14.0);

-- 3. Prozedur "Insert_GPS_Data" erstellen

CREATE PROCEDURE Insert_GPS_Data()
BEGIN
    DECLARE @container_id INT;
    DECLARE @latitude FLOAT;
    DECLARE @longitude FLOAT;

    WHILE @container_id IS NOT NULL
    BEGIN
        SELECT TOP 1
            @container_id = container_id,
            @latitude = latitude,
            @longitude = longitude
        FROM GPS_Data
        ORDER BY RAND();

        IF @container_id IS NOT NULL
        BEGIN
            INSERT INTO GPS_Data (container_id, latitude, longitude)
            VALUES (@container_id, @latitude, @longitude);
        END
    END
END;

-- 4. Abfrage zum Aktualisieren der GPS-Daten

UPDATE GPS_Data
SET 
    latitude = latitude + (0.0001 * RAND()),
    longitude = longitude + (0.0001 * RAND())
WHERE 
    container_id IN (
        SELECT container_id
        FROM Container
        WHERE container_name != 'CONTAINER_NAME_STILL'
    );

-- 5. Optionale Abfrage zum Verschieben eines Containers in eine andere Richtung

UPDATE GPS_Data
SET 
    latitude = latitude + (0.0002 * RAND()),
    longitude = longitude - (0.0002 * RAND())
WHERE 
    container_id = (
        SELECT container_id
        FROM Container
        WHERE container_name = 'CONTAINER_NAME_ANDERER_RICHTUNG'
    );

-- 6. Prozedur "Insert_GPS_Data" ausführen

CALL Insert_GPS_Data();
